const { Op } = require('sequelize');
const Notification = require('../models/Notification');
const NotificationRule = require('../models/NotificationRule');
const User = require('../models/User');
const { sendEmail } = require('./emailService');
const { loadPermissionMap } = require('../middleware/rbac');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Licence = require('../models/Licence');
const Contract = require('../models/Contract');
const ComplianceObligation = require('../models/ComplianceObligation');
const Correspondence = require('../models/Correspondence');
const BudgetLine = require('../models/BudgetLine');
const Finance = require('../models/Finance');
const Document = require('../models/Document');
const Risk = require('../models/Risk');
const InsurancePolicy = require('../models/InsurancePolicy');
const EnvironmentalPermit = require('../models/EnvironmentalPermit');
const Nda = require('../models/Nda');
const VendorInvoice = require('../models/VendorInvoice');
const ForexTransaction = require('../models/ForexTransaction');
const LocalContentRecord = require('../models/LocalContentRecord');
const HseIncident = require('../models/HseIncident');

// Maps a MODULE_REGISTRY module name to the RBAC permission key that governs
// who's eligible to RECEIVE notifications for it (§10.4 "add notification
// permission for each module"). Seeded/derived in server.js's defaultMatrix.
// Used by resolveRecipients() below whenever a rule has no specific
// per-record owner to fall back on.
const MODULE_NOTIFY_PERMISSIONS = {
  Activity: 'activities.notify',
  Task: 'tasks.notify',
  Licence: 'licences.notify',
  Contract: 'contracts.notify',
  ComplianceObligation: 'compliance.notify',
  Correspondence: 'correspondence.notify',
  Document: 'documents.notify',
  BudgetLine: 'budget.notify',
  FinanceAFE: 'finance.notify',
  Risk: 'risks.notify',
  InsurancePolicy: 'insurance.notify',
  EnvironmentalPermit: 'env_permits.notify',
  Nda: 'nda.notify',
  VendorInvoice: 'vendor_payments.notify',
  ForexTransaction: 'forex.notify',
  LocalContentRecord: 'local_content.notify',
  HseIncident: 'hse.notify'
};

// ---------------------------------------------------------------------------
// Module registry — the ONLY place that needs to change when a new source
// module (Contract, Compliance Obligation, etc.) is added later. The engine
// itself is fully generic: add a rule row + a registry entry and reminders,
// escalation and re-arming all work without touching evaluation logic
// (Requirements §10.4 — "without a code change" to the engine).
// ---------------------------------------------------------------------------
const MODULE_REGISTRY = {
  Activity: {
    model: Activity,
    openWhere: { status: { [Op.ne]: 'Completed' } },
    priorityField: 'priority',
    label: (record) => `Activity "${record.name}"`,
    ownerResolver: (record) => resolveUserByName(record.assignedTo)
  },
  Task: {
    model: Task,
    openWhere: { status: { [Op.notIn]: ['Completed'] } },
    priorityField: 'priority',
    label: (record) => `Task "${record.title}"`,
    ownerResolver: (record) => Promise.resolve(record.assignedToId || null)
  },
  Licence: {
    model: Licence,
    openWhere: { status: 'Active' },
    priorityField: null,
    label: (record) => `${record.licenceType || 'Licence'} ${record.licenceNumber || ''}`.trim(),
    // Licence has no responsible-person field yet — falls back to Admin/Manager broadcast.
    ownerResolver: () => Promise.resolve(null)
  },
  Contract: {
    model: Contract,
    openWhere: { status: { [Op.notIn]: ['Expired', 'Terminated'] } },
    priorityField: null,
    label: (record) => `Contract "${record.title}" (${record.counterparty || 'unknown counterparty'})`,
    ownerResolver: (record) => resolveUserByName(record.owner)
  },
  ComplianceObligation: {
    model: ComplianceObligation,
    openWhere: { status: { [Op.notIn]: ['Closed'] } },
    priorityField: null,
    label: (record) => `Compliance obligation "${record.description}"${record.regulatoryBody ? ` (${record.regulatoryBody})` : ''}`,
    ownerResolver: (record) => resolveUserByName(record.responsibleOfficer)
  },
  Correspondence: {
    model: Correspondence,
    openWhere: { awaitingResponse: true, status: 'Open' },
    priorityField: null,
    label: (record) => `Correspondence "${record.subject}"${record.regulator ? ` (${record.regulator})` : ''} — awaiting response`,
    // Correspondence has no single owner field yet — falls back to Admin/Manager broadcast.
    ownerResolver: () => Promise.resolve(null)
  },
  Document: {
    model: Document,
    openWhere: { awaitingResponseFrom: { [Op.ne]: null }, status: { [Op.ne]: 'Superseded' } },
    priorityField: null,
    label: (record) => `Document "${record.title}" — awaiting response from ${record.awaitingResponseFrom}`,
    ownerResolver: (record) => Promise.resolve(record.ownerId || null)
  },
  BudgetLine: {
    model: BudgetLine,
    openWhere: { status: { [Op.ne]: 'Closed' } },
    priorityField: null,
    label: (record) => `Budget line "${record.description}"`,
    ownerResolver: (record) => resolveUserByName(record.responsiblePerson)
  },
  FinanceAFE: {
    model: Finance,
    openWhere: { recordType: 'AFE', status: { [Op.notIn]: ['Closed', 'Rejected'] } },
    priorityField: null,
    label: (record) => `AFE "${record.afeNumber || record.item}"`,
    ownerResolver: (record) => resolveUserByName(record.approvingAuthority)
  },
  Risk: {
    model: Risk,
    openWhere: { status: { [Op.ne]: 'Closed' } },
    priorityField: null,
    label: (record) => `Risk "${record.title}" (${record.severity} severity / ${record.probability} probability)`,
    ownerResolver: (record) => resolveUserByName(record.owner)
  },
  InsurancePolicy: {
    model: InsurancePolicy,
    openWhere: { status: { [Op.notIn]: ['Expired', 'Cancelled'] } },
    priorityField: null,
    label: (record) => `Insurance policy "${record.policyNumber}"${record.insurer ? ` (${record.insurer})` : ''}`,
    ownerResolver: (record) => resolveUserByName(record.owner)
  },
  EnvironmentalPermit: {
    model: EnvironmentalPermit,
    openWhere: { status: { [Op.notIn]: ['Expired'] } },
    priorityField: null,
    label: (record) => `${record.permitType || 'Environmental permit'} "${record.permitNumber}"`,
    ownerResolver: (record) => resolveUserByName(record.owner)
  },
  Nda: {
    model: Nda,
    openWhere: { status: { [Op.notIn]: ['Expired', 'Terminated'] } },
    priorityField: null,
    label: (record) => `NDA with "${record.counterparty}"`,
    ownerResolver: (record) => resolveUserByName(record.owner)
  },
  VendorInvoice: {
    model: VendorInvoice,
    openWhere: { status: { [Op.ne]: 'Paid' } },
    priorityField: null,
    label: (record) => `Vendor invoice "${record.invoiceNumber || record.id}" (${record.vendor})`,
    // No owner field on VendorInvoice yet — falls back to Admin/Manager broadcast.
    ownerResolver: () => Promise.resolve(null)
  },
  ForexTransaction: {
    model: ForexTransaction,
    openWhere: { status: 'Approved' },
    priorityField: null,
    label: (record) => `Forex transaction "${record.reference || record.id}" (${record.fromCurrency}\u2192${record.toCurrency})`,
    // requestedById/approvedById are already proper user FKs, no name lookup needed.
    ownerResolver: (record) => Promise.resolve(record.approvedById || record.requestedById || null)
  },
  LocalContentRecord: {
    model: LocalContentRecord,
    openWhere: {},
    priorityField: null,
    label: (record) => `Local content ${record.metric} shortfall for ${record.period}`,
    // No owner field on LocalContentRecord — falls back to Admin/Manager broadcast.
    ownerResolver: () => Promise.resolve(null)
  },
  HseIncident: {
    model: HseIncident,
    openWhere: { status: { [Op.ne]: 'Closed' } },
    priorityField: null,
    label: (record) => `HSE incident "${record.incidentType}" (${record.severity} severity)${record.location ? ` at ${record.location}` : ''}`,
    ownerResolver: (record) => resolveUserByName(record.actionOwner)
  }
};

function renderTemplate(template, record) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = typeof record.get === 'function' ? record.get(key) : record[key];
    return value != null ? String(value) : '';
  });
}

function mapPriorityToType(priority) {
  switch (priority) {
    case 'Critical':
      return 'Error';
    case 'High':
      return 'Warning';
    case 'Low':
      return 'Info';
    default:
      return 'Warning';
  }
}

// Best-effort match of a free-text "assignedTo" name against a real user
// account. Activity.assignedTo is a plain string today (see Requirements Gap
// Checklist §5.1/§5.2) so this is a stopgap until it becomes a proper FK.
async function resolveUserByName(name) {
  if (!name) return null;
  const trimmed = String(name).trim();
  if (!trimmed) return null;

  const direct = await User.findOne({
    where: { [Op.or]: [{ username: trimmed }, { email: trimmed }] }
  });
  if (direct) return direct.id;

  const candidates = await User.findAll({ attributes: ['id', 'firstName', 'lastName'] });
  const match = candidates.find(
    (u) => `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase() === trimmed.toLowerCase()
  );
  return match ? match.id : null;
}

// Delivers the Email channel for a notification, when the rule/notification
// requests it (`channels` includes 'Email') and the recipient has a real
// email on file. Best-effort — failures/missing config never block the
// always-on InApp channel (see emailService.sendEmail()).
async function deliverEmailChannel(channels, userId, subject, message) {
  if (!Array.isArray(channels) || !channels.includes('Email')) return;
  if (!userId) return;

  const user = await User.findByPk(userId, { attributes: ['id', 'email', 'firstName', 'lastName'] });
  if (!user || !user.email) return;

  await sendEmail({ to: user.email, subject, text: message });
}

// Falls back to notifying whoever holds the module's `<module>.notify` RBAC
// permission (Admin always qualifies) when no specific per-record owner can
// be resolved (e.g. Licence has no responsible-person field yet) — replaces
// the previous hardcoded "broadcast to every Admin/Manager org-wide"
// behaviour. When the rule has `departmentIds` set, this is further narrowed
// to users in ANY of those departments (§10.4 "one module notification can
// be sent to multiple department"). Has no effect when `recipientId` is
// already resolved (e.g. Task.assignedToId) — a specific owner is always
// notified about their own record regardless of department.
async function resolveRecipients(recipientId, rule) {
  if (recipientId) return [recipientId];

  const where = { active: true };
  const departmentIds = rule?.departmentIds;
  if (Array.isArray(departmentIds) && departmentIds.length > 0) {
    where.departmentId = { [Op.in]: departmentIds };
  }

  const candidates = await User.findAll({ where, attributes: ['id', 'role'] });

  const notifyPermission = MODULE_NOTIFY_PERMISSIONS[rule?.module];
  if (!notifyPermission) {
    // No RBAC mapping for this module (shouldn't normally happen for a
    // MODULE_REGISTRY-backed rule) — preserve the previous Admin/Manager
    // broadcast, still honouring the department filter above.
    return candidates.filter((u) => ['Admin', 'Manager'].includes(u.role)).map((u) => u.id);
  }

  const permissionMap = await loadPermissionMap();
  return candidates
    .filter((u) => u.role === 'Admin' || permissionMap.get(u.role)?.has(notifyPermission))
    .map((u) => u.id);
}

// Creates or "re-arms" a notification per recipient. Re-arming is what makes
// a recurring alert reappear every login/interval until Done or snoozed
// (Requirements §5.2 business rule / §10.1 Recurring trigger type).
async function armNotification({ rule, module, entityId, bucket, dueAt, message, recipientId, priority }) {
  const recipients = await resolveRecipients(recipientId, rule);
  const effectivePriority = priority || rule.priority;
  const now = new Date();

  const emailSubject = `[PlanetOne] ${effectivePriority} priority alert — ${module}`;

  for (const userId of recipients) {
    // Includes rule.id (not just module) so two different rules watching the
    // SAME module (e.g. Licence's separate "expiry" and "phase countdown"
    // DateBased rules, §5.9) never collide into the same Notification row
    // just because they happen to compute the same lead-time bucket.
    const dedupeKey = `${module}|${rule.id}|${entityId}|${rule.triggerType}|${bucket}|${userId}`;
    const existing = await Notification.findOne({ where: { dedupeKey } });

    if (!existing) {
      await Notification.create({
        message,
        type: mapPriorityToType(effectivePriority),
        userId,
        module,
        entityType: module,
        entityId,
        triggerType: rule.triggerType,
        priority: effectivePriority,
        channels: rule.channels,
        status: 'Pending',
        dueAt,
        dedupeKey,
        recurrenceIntervalHours: rule.recurrenceIntervalHours,
        lastSentAt: now
      });
      await deliverEmailChannel(rule.channels, userId, emailSubject, message);
      continue;
    }

    // Still snoozed by the user — leave it alone until the snooze expires.
    if (existing.status === 'Snoozed' && existing.snoozeUntil && new Date(existing.snoozeUntil) > now) {
      continue;
    }

    const intervalMs = (rule.recurrenceIntervalHours || 24) * 3600 * 1000;
    const dueForResend = !existing.lastSentAt || now.getTime() - new Date(existing.lastSentAt).getTime() >= intervalMs;

    if (dueForResend) {
      const shouldReopen = ['Acknowledged', 'Dismissed', 'Snoozed'].includes(existing.status);
      await existing.update({
        status: shouldReopen ? 'Pending' : existing.status,
        message,
        dueAt,
        priority: effectivePriority,
        lastSentAt: now
      });
      await deliverEmailChannel(rule.channels, userId, emailSubject, message);
    }
  }
}

async function evaluateDateBased(rule) {
  const registryEntry = MODULE_REGISTRY[rule.module];
  if (!registryEntry || !rule.dateField) return;

  const { model, openWhere, label, ownerResolver, priorityField } = registryEntry;
  const records = await model.findAll({
    where: { ...(openWhere || {}), [rule.dateField]: { [Op.ne]: null } }
  });

  const now = new Date();
  const leadTimes = [...(rule.leadTimeDays || [])].sort((a, b) => b - a);

  for (const record of records) {
    const dueDate = new Date(record.get(rule.dateField));
    if (Number.isNaN(dueDate.getTime())) continue;

    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 3600 * 1000));

    let bucket = null;
    if (diffDays < 0) {
      bucket = 'overdue';
    } else {
      for (const lt of leadTimes) {
        if (diffDays <= lt) bucket = `lead${lt}`;
      }
    }
    if (!bucket) continue;

    // Urgency escalates automatically as the deadline nears, independent of
    // the record's own priority field (mirrors §5.9 licence countdown rule).
    let dynamicPriority = (priorityField && record[priorityField]) || rule.priority;
    if (bucket === 'overdue' || diffDays <= 30) dynamicPriority = 'Critical';
    else if (diffDays <= 90 && dynamicPriority !== 'Critical') dynamicPriority = 'High';

    const defaultMessage =
      bucket === 'overdue'
        ? `${label(record)} is overdue (was due ${dueDate.toDateString()})`
        : `${label(record)} is due in ${diffDays} day(s) (${dueDate.toDateString()})`;

    await armNotification({
      rule,
      module: rule.module,
      entityId: String(record.id),
      bucket,
      dueAt: dueDate,
      message: rule.messageTemplate ? renderTemplate(rule.messageTemplate, record) : defaultMessage,
      recipientId: await ownerResolver(record),
      priority: dynamicPriority
    });
  }
}

async function evaluateStatusBased(rule) {
  const registryEntry = MODULE_REGISTRY[rule.module];
  if (!registryEntry || !rule.statusField || !rule.statusValue) return;

  const { model, label, ownerResolver, priorityField } = registryEntry;
  const records = await model.findAll({ where: { [rule.statusField]: rule.statusValue } });

  for (const record of records) {
    const priority = (priorityField && record[priorityField]) || rule.priority;
    await armNotification({
      rule,
      module: rule.module,
      entityId: String(record.id),
      bucket: `status-${rule.statusValue}`,
      dueAt: null,
      message: rule.messageTemplate
        ? renderTemplate(rule.messageTemplate, record)
        : `${label(record)} — status is "${rule.statusValue}"`,
      recipientId: await ownerResolver(record),
      priority
    });
  }
}

async function evaluateThresholdBased(rule) {
  const registryEntry = MODULE_REGISTRY[rule.module];
  if (!registryEntry || !rule.thresholdField || !(rule.thresholdValues || []).length) return;

  const { model, label, ownerResolver, openWhere } = registryEntry;
  // Apply the registry's openWhere scope — matters when a module's records
  // share a table with other record types (e.g. Finance covers Entry/
  // Invoice/AFE), so thresholds are only evaluated against the intended rows.
  const records = await model.findAll({ where: openWhere || {} });

  for (const record of records) {
    const value = Number(record.get(rule.thresholdField));
    if (Number.isNaN(value)) continue;

    const crossed = [...rule.thresholdValues].filter((t) => value >= t).sort((a, b) => b - a);
    if (crossed.length === 0) continue;

    const topThreshold = crossed[0];
    await armNotification({
      rule,
      module: rule.module,
      entityId: String(record.id),
      bucket: `threshold${topThreshold}`,
      dueAt: null,
      message: rule.messageTemplate
        ? renderTemplate(rule.messageTemplate, record)
        : `${label(record)} — ${rule.thresholdField} crossed ${topThreshold}`,
      recipientId: await ownerResolver(record),
      priority: topThreshold >= 100 ? 'Critical' : rule.priority
    });
  }
}

async function evaluateRecurring(rule) {
  const registryEntry = MODULE_REGISTRY[rule.module];
  if (!registryEntry) return;

  const { model, openWhere, label, ownerResolver, priorityField } = registryEntry;
  const records = await model.findAll({ where: openWhere || {} });

  for (const record of records) {
    const priority = (priorityField && record[priorityField]) || rule.priority;
    await armNotification({
      rule,
      module: rule.module,
      entityId: String(record.id),
      bucket: 'recurring',
      dueAt: null,
      message: rule.messageTemplate ? renderTemplate(rule.messageTemplate, record) : `${label(record)} — reminder`,
      recipientId: await ownerResolver(record),
      priority
    });
  }
}

// Escalates any still-Pending alert that has passed its rule's configured
// grace period. Fires exactly once per breach because status flips to
// 'Escalated' and this sweep only ever looks at 'Pending' rows.
async function escalateOverdue() {
  const rules = await NotificationRule.findAll({
    where: { active: true, escalationGraceHours: { [Op.ne]: null } }
  });
  if (rules.length === 0) return;

  const graceByModule = new Map(rules.map((r) => [r.module, r.escalationGraceHours]));
  const now = new Date();

  const pending = await Notification.findAll({
    where: { status: 'Pending', dueAt: { [Op.ne]: null } }
  });

  const admins = await User.findAll({ where: { role: 'Admin', active: true }, attributes: ['id'] });
  const escalateToId = admins[0]?.id || null;

  for (const notif of pending) {
    const graceHours = graceByModule.get(notif.module);
    if (!graceHours) continue;

    const graceMs = graceHours * 3600 * 1000;
    if (now.getTime() - new Date(notif.dueAt).getTime() < graceMs) continue;

    await notif.update({ status: 'Escalated', escalatedAt: now, escalatedToUserId: escalateToId });

    if (escalateToId && escalateToId !== notif.userId) {
      const escalationMessage = `ESCALATION: ${notif.message} (unacknowledged past grace period)`;
      await Notification.create({
        message: escalationMessage,
        type: 'Error',
        userId: escalateToId,
        module: notif.module,
        entityType: notif.entityType,
        entityId: notif.entityId,
        triggerType: notif.triggerType,
        priority: 'Critical',
        channels: notif.channels,
        status: 'Pending',
        dueAt: notif.dueAt,
        dedupeKey: `${notif.dedupeKey}|escalation`,
        lastSentAt: now
      });
      await deliverEmailChannel(
        notif.channels,
        escalateToId,
        `[PlanetOne] ESCALATION — ${notif.module}`,
        escalationMessage
      );
    }
  }
}

async function evaluateRules() {
  // Keep Task.status in sync with the §5.3 automatic Overdue business rule
  // before evaluating date-based reminders, so overdue tasks are reflected
  // consistently regardless of whether anyone has loaded the Tasks page.
  try {
    const { syncAllOverdueTasks } = require('./taskStatusSync');
    await syncAllOverdueTasks();
  } catch (err) {
    console.error('[notification-engine] task overdue sync failed:', err.message);
  }

  const rules = await NotificationRule.findAll({ where: { active: true } });

  for (const rule of rules) {
    try {
      if (rule.triggerType === 'DateBased') await evaluateDateBased(rule);
      else if (rule.triggerType === 'StatusBased') await evaluateStatusBased(rule);
      else if (rule.triggerType === 'ThresholdBased') await evaluateThresholdBased(rule);
      else if (rule.triggerType === 'Recurring') await evaluateRecurring(rule);
    } catch (err) {
      console.error(`[notification-engine] rule "${rule.name}" failed:`, err.message);
    }
  }

  await escalateOverdue();
}

module.exports = { evaluateRules, MODULE_REGISTRY };
