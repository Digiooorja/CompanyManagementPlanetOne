const app = require('./app');
const sequelize = require('./database');
const { QueryTypes } = require('sequelize');
const Department = require('./models/Department');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Apply schema changes using migrations. Sync is only for initial missing tables.
    const queryInterface = sequelize.getQueryInterface();
    await sequelize.sync();
    console.log('Database synchronized');

    // Load the Admin-configurable Risk Register scoring matrix (§5.15) into
    // the in-process cache so Risk.riskScore/riskBand VIRTUAL getters — which
    // must be synchronous — can read it without a DB round-trip per access.
    const RiskMatrixSetting = require('./models/RiskMatrixSetting');
    const { setRiskMatrixConfig } = require('./config/riskMatrix');
    const [riskMatrixSettings] = await RiskMatrixSetting.findOrCreate({ where: { id: 1 } });
    setRiskMatrixConfig(riskMatrixSettings.toJSON());

    const departmentNames = [
      'Executive Management',
      'Procurement',
      'Accounts',
      'Operations',
      'Finance & Accounts',
      'HSE',
      'Commercial',
      'HR'
    ];

    for (const name of departmentNames) {
      await Department.findOrCreate({
        where: { name }
      });
    }

    let usersTable = null;

    try {
      usersTable = await queryInterface.describeTable('users');
    } catch (err) {
      usersTable = null;
    }

    if (usersTable && usersTable.department) {
      const legacyUsers = await sequelize.query(
        'SELECT id, department FROM users WHERE department IS NOT NULL AND "departmentId" IS NULL',
        { type: QueryTypes.SELECT }
      );

      for (const legacyUser of legacyUsers) {
        const department = await Department.findOne({
          where: { name: legacyUser.department }
        });
        if (department) {
          await sequelize.query(
            'UPDATE users SET "departmentId" = :departmentId WHERE id = :userId',
            {
              replacements: { departmentId: department.id, userId: legacyUser.id },
              type: QueryTypes.UPDATE
            }
          );
        }
      }

      await queryInterface.removeColumn('users', 'department');
    }

    // Seed default Notification & Alert Engine rules (§10) if none exist yet.
    // Admin can subsequently retune/disable/add rules via /api/notification-rules
    // without any code change.
    const NotificationRule = require('./models/NotificationRule');
    const defaultRules = [
      {
        name: 'Activity due-date reminders',
        module: 'Activity',
        triggerType: 'DateBased',
        dateField: 'dueDate',
        leadTimeDays: [7, 3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 48,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Task due-date reminders',
        module: 'Task',
        triggerType: 'DateBased',
        dateField: 'dueDate',
        leadTimeDays: [3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 72,
        priority: 'Medium',
        channels: ['InApp']
      },
      {
        name: 'Licence expiry countdown',
        module: 'Licence',
        triggerType: 'DateBased',
        dateField: 'expiryDate',
        leadTimeDays: [180, 90, 30],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        // §5.9 "Licence Phase Countdown" — a second, independent DateBased
        // rule on the same Licence module (dateField='phaseEndDate' instead
        // of 'expiryDate'). Needs no MODULE_REGISTRY/engine changes; the
        // engine already supports multiple rules per module. <30 days maps
        // to 'Critical' the same way evaluateDateBased() escalates any
        // date-based rule automatically (see notificationEngine.js).
        name: 'Licence phase countdown',
        module: 'Licence',
        triggerType: 'DateBased',
        dateField: 'phaseEndDate',
        leadTimeDays: [180, 90, 30],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Contract expiry/renewal reminders',
        module: 'Contract',
        triggerType: 'DateBased',
        dateField: 'expiryDate',
        leadTimeDays: [90, 60, 30],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Compliance obligation due-date reminders',
        module: 'ComplianceObligation',
        triggerType: 'DateBased',
        dateField: 'dueDate',
        leadTimeDays: [30, 14, 7, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 24,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'PC/GNPC correspondence response-due reminders',
        module: 'Correspondence',
        triggerType: 'DateBased',
        dateField: 'responseDueDate',
        leadTimeDays: [14, 7, 3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Budget line variance threshold',
        module: 'BudgetLine',
        triggerType: 'ThresholdBased',
        thresholdField: 'absVariancePercent',
        thresholdValues: [10],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Budget line utilisation alert',
        module: 'BudgetLine',
        triggerType: 'ThresholdBased',
        thresholdField: 'utilisationPercent',
        thresholdValues: [90, 100],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'AFE utilisation alert',
        module: 'FinanceAFE',
        triggerType: 'ThresholdBased',
        thresholdField: 'utilisationPercent',
        thresholdValues: [80, 100],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Document awaiting-response reminders',
        module: 'Document',
        triggerType: 'DateBased',
        dateField: 'responseDueDate',
        leadTimeDays: [7, 3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 72,
        priority: 'Medium',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Risk review-date reminders',
        module: 'Risk',
        triggerType: 'DateBased',
        dateField: 'reviewDate',
        leadTimeDays: [14, 7, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 72,
        priority: 'Medium',
        channels: ['InApp']
      },
      {
        // §5.15 "high-band escalation" — riskScore is a VIRTUAL field (not a
        // real column), so this only works because evaluateThresholdBased()
        // evaluates thresholds in application code via `record.get(field)`
        // rather than in the SQL WHERE clause (see notificationEngine.js).
        // Note: [7] mirrors the *default* highThreshold in
        // backend/config/riskMatrix.js — if an Admin retunes the matrix via
        // PUT /api/risks/matrix-config, also update this rule's
        // thresholdValues via PUT /api/notification-rules to match.
        name: 'Risk high-band escalation',
        module: 'Risk',
        triggerType: 'ThresholdBased',
        thresholdField: 'riskScore',
        thresholdValues: [7],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'Critical',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Insurance policy expiry',
        module: 'InsurancePolicy',
        triggerType: 'DateBased',
        dateField: 'expiryDate',
        leadTimeDays: [90, 60, 30, 7],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Environmental permit expiry',
        module: 'EnvironmentalPermit',
        triggerType: 'DateBased',
        dateField: 'expiryDate',
        leadTimeDays: [180, 90, 30],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'NDA expiry reminder',
        module: 'Nda',
        triggerType: 'DateBased',
        dateField: 'expiryDate',
        leadTimeDays: [30, 7, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'Medium',
        channels: ['InApp']
      },
      {
        name: 'Vendor payment aging',
        module: 'VendorInvoice',
        triggerType: 'ThresholdBased',
        thresholdField: 'daysOutstanding',
        thresholdValues: [30, 60, 90],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Forex settlement due',
        module: 'ForexTransaction',
        triggerType: 'DateBased',
        dateField: 'settlementDate',
        leadTimeDays: [3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Local content shortfall',
        module: 'LocalContentRecord',
        triggerType: 'ThresholdBased',
        thresholdField: 'shortfallPercent',
        thresholdValues: [5, 10],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'HSE incident action due',
        module: 'HseIncident',
        triggerType: 'DateBased',
        dateField: 'actionDueDate',
        leadTimeDays: [7, 3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 48,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        // §7 "high-band escalation" analogue for HSE: daysOverdue is a
        // VIRTUAL field (not a real column), so this only works because
        // evaluateThresholdBased() evaluates thresholds in application code
        // via `record.get(field)` rather than in the SQL WHERE clause (see
        // notificationEngine.js) — same technique as Risk.riskScore.
        name: 'HSE overdue-action escalation',
        module: 'HseIncident',
        triggerType: 'ThresholdBased',
        thresholdField: 'daysOverdue',
        thresholdValues: [1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'Critical',
        channels: ['InApp', 'Email']
      }
    ];

    for (const rule of defaultRules) {
      await NotificationRule.findOrCreate({ where: { name: rule.name }, defaults: rule });
    }

    // Seed the configurable RBAC matrix (§4) if it doesn't exist yet: system
    // roles backing the legacy adminMiddleware/managerMiddleware checks, the
    // business roles from the requirements table, the permission catalog the
    // API actually enforces, and a sensible default role->permission mapping.
    // Admin can subsequently add roles, edit descriptions, and reassign
    // permissions via /api/admin/roles and /api/admin/role-permissions
    // without any code change.
    const roleSeeds = [
      { name: 'Admin', description: 'Admin / IT — technical superuser: user management, RBAC configuration, system settings.', isSystem: true },
      { name: 'Manager', description: 'Legacy operational manager — broad create/edit rights across core operational modules.', isSystem: true },
      { name: 'User', description: 'Legacy standard user — view access plus document/comment contributions.', isSystem: true },
      { name: 'Chairman/Board', description: 'Ultimate oversight of the venture. Chairman View, read-only summaries, one-click export — no edit rights.' },
      { name: 'CEO/Country Manager', description: 'Overall executive management. Full read access; approval authority on budgets, decisions, AFEs.' },
      { name: 'Project/Operations Manager', description: 'Day-to-day project & operations delivery. Full access to tasks, activities, work programme, operations updates.' },
      { name: 'Legal/Compliance Officer', description: 'Regulatory, contractual and correspondence oversight. Full access to contracts, compliance tracker, correspondence log, NDA tracker.' },
      { name: 'Finance/Accounts', description: 'Budget, AFE and payment management. Full access to budget tracker, AFE tracking, vendor payment aging, forex workflow.' },
      { name: 'HSE Officer', description: 'Health, safety and environment oversight. Full access to HSE register, environmental permit tracker.' },
      { name: 'Geologist/Drilling Engineer', description: 'Technical operations reporting. Full access to daily drilling/geological reports, reserves tracker.' },
      { name: 'Team Member/Staff', description: 'General contributor. Access limited to assigned tasks, activities and documents.' },
      { name: 'External Partner', description: 'JV partner / auditor with limited visibility. Read-only access to specifically shared documents or reports.' }
    ];

    const roleRows = {};
    for (const seed of roleSeeds) {
      const [role] = await Role.findOrCreate({ where: { name: seed.name }, defaults: seed });
      roleRows[seed.name] = role;
    }

    const permissionSeeds = [
      { key: 'blocks.manage', module: 'Blocks & Assets', description: 'Create, edit and delete blocks' },
      { key: 'projects.manage', module: 'Projects', description: 'Create, edit and delete projects' },
      { key: 'activities.manage', module: 'Activities', description: 'Create, edit and delete activities' },
      { key: 'tasks.manage', module: 'Tasks', description: 'Create, edit and delete tasks' },
      { key: 'documents.manage', module: 'Documents', description: 'Upload, edit and delete documents' },
      { key: 'comments.manage', module: 'Comments', description: 'Create, edit and delete comments on activities and tasks' },
      { key: 'finance.manage', module: 'Finance & Budget', description: 'Create and edit budget/finance line items' },
      { key: 'finance.approve', module: 'Finance & Budget', description: 'Approve or reject AFEs and budget revisions' },
      { key: 'contracts.manage', module: 'Contract Register', description: 'Create, edit and delete contracts' },
      { key: 'compliance.manage', module: 'Compliance Tracker', description: 'Create, edit and close compliance obligations' },
      { key: 'correspondence.manage', module: 'Correspondence Log', description: 'Create and edit correspondence entries' },
      { key: 'decisions.manage', module: 'Decision Log', description: 'Create and edit decisions' },
      { key: 'operations_updates.manage', module: 'Operations Update', description: 'Create and edit operations updates' },
      { key: 'budget.manage', module: 'Work Programme & Budget Tracker', description: 'Create and edit budget lines; request/approve budget revisions' },
      { key: 'licences.manage', module: 'Licences', description: 'Create and edit licences' },
      { key: 'risks.manage', module: 'Risk Register', description: 'Create and edit risks' },
      { key: 'workflows.manage', module: 'Workflows', description: 'Create and edit workflows' },
      { key: 'registers.manage', module: 'Registers', description: 'Create and edit registers' },
      { key: 'reports.view', module: 'Reports', description: 'View reports' },
      { key: 'reports.manage', module: 'Reports', description: 'Create, edit and delete report catalogue definitions' },
      { key: 'dashboards.view', module: 'Dashboards', description: 'View operational dashboards' },
      { key: 'chairman_view.access', module: 'Chairman View', description: 'Access the executive Chairman View' },
      { key: 'audit.view', module: 'Audit Log', description: 'View and export the audit log' },
      { key: 'admin.manage_users', module: 'Administration', description: 'Create, edit and deactivate user accounts' },
      { key: 'admin.manage_rbac', module: 'Administration', description: 'Configure roles and the permission matrix' },
      { key: 'notifications.manage_rules', module: 'Notifications', description: 'Configure notification & alert engine rules' },
      { key: 'insurance.manage', module: 'Insurance Register', description: 'Create, edit and delete insurance policies' },
      { key: 'env_permits.manage', module: 'Environmental Permit Tracker', description: 'Create, edit and delete environmental permits' },
      { key: 'nda.manage', module: 'NDA & Data Room Tracker', description: 'Create, edit and delete NDAs and data-room grants' },
      { key: 'vendor_payments.manage', module: 'Vendor Payment Aging', description: 'Create, edit and delete vendor invoices' },
      { key: 'forex.manage', module: 'Forex & Banking Workflow', description: 'Create, edit and action forex transactions (request/approve/reject/settle)' },
      { key: 'local_content.manage', module: 'Local Content Tracking', description: 'Create, edit and delete local-content tracking records' },
      { key: 'hse.manage', module: 'HSE Register', description: 'Create, edit, close and delete HSE incidents' },

      // --- Per-module notification permissions (§10.4) ---
      // Governs who is eligible to RECEIVE alerts for a module, separately
      // from who can EDIT its records — orthogonal to the `.manage`
      // permission above (e.g. someone might want alerts without edit
      // rights, or vice versa). Used by the Notification Engine's
      // resolveRecipients() (services/notificationEngine.js) whenever a
      // rule has no specific per-record owner to notify (falls back to
      // "anyone whose role holds this permission", optionally further
      // restricted to one department via NotificationRule.departmentId).
      // defaultMatrix below auto-derives these from the matching `.manage`
      // grant for every role, so no per-role list needs to be duplicated.
      { key: 'activities.notify', module: 'Activities', description: 'Receive notifications/alerts for activities' },
      { key: 'tasks.notify', module: 'Tasks', description: 'Receive notifications/alerts for tasks' },
      { key: 'licences.notify', module: 'Licences', description: 'Receive notifications/alerts for licences' },
      { key: 'contracts.notify', module: 'Contract Register', description: 'Receive notifications/alerts for contracts' },
      { key: 'compliance.notify', module: 'Compliance Tracker', description: 'Receive notifications/alerts for compliance obligations' },
      { key: 'correspondence.notify', module: 'Correspondence Log', description: 'Receive notifications/alerts for correspondence' },
      { key: 'documents.notify', module: 'Documents', description: 'Receive notifications/alerts for documents' },
      { key: 'budget.notify', module: 'Work Programme & Budget Tracker', description: 'Receive notifications/alerts for budget lines' },
      { key: 'finance.notify', module: 'Finance & Budget', description: 'Receive notifications/alerts for AFEs/finance records' },
      { key: 'risks.notify', module: 'Risk Register', description: 'Receive notifications/alerts for risks' },
      { key: 'insurance.notify', module: 'Insurance Register', description: 'Receive notifications/alerts for insurance policies' },
      { key: 'env_permits.notify', module: 'Environmental Permit Tracker', description: 'Receive notifications/alerts for environmental permits' },
      { key: 'nda.notify', module: 'NDA & Data Room Tracker', description: 'Receive notifications/alerts for NDAs' },
      { key: 'vendor_payments.notify', module: 'Vendor Payment Aging', description: 'Receive notifications/alerts for vendor invoices' },
      { key: 'forex.notify', module: 'Forex & Banking Workflow', description: 'Receive notifications/alerts for forex transactions' },
      { key: 'local_content.notify', module: 'Local Content Tracking', description: 'Receive notifications/alerts for local-content records' },
      { key: 'hse.notify', module: 'HSE Register', description: 'Receive notifications/alerts for HSE incidents' }
    ];

    const permissionRows = {};
    for (const seed of permissionSeeds) {
      const [permission] = await Permission.findOrCreate({ where: { key: seed.key }, defaults: seed });
      permissionRows[seed.key] = permission;
    }

    const defaultMatrix = {
      Manager: [
        'blocks.manage', 'projects.manage', 'activities.manage', 'tasks.manage', 'risks.manage',
        'workflows.manage', 'registers.manage', 'contracts.manage', 'compliance.manage',
        'correspondence.manage', 'decisions.manage', 'operations_updates.manage', 'licences.manage',
        'budget.manage', 'insurance.manage', 'env_permits.manage', 'nda.manage',
        'vendor_payments.manage', 'forex.manage', 'local_content.manage', 'hse.manage',
        'documents.manage', 'comments.manage', 'finance.manage', 'dashboards.view', 'reports.view'
      ],
      User: ['dashboards.view', 'reports.view', 'documents.manage', 'comments.manage'],
      'Chairman/Board': ['dashboards.view', 'chairman_view.access', 'reports.view'],
      'CEO/Country Manager': ['dashboards.view', 'chairman_view.access', 'reports.view', 'finance.approve', 'decisions.manage', 'activities.manage', 'tasks.manage', 'documents.manage', 'comments.manage'],
      'Project/Operations Manager': ['blocks.manage', 'projects.manage', 'tasks.manage', 'activities.manage', 'operations_updates.manage', 'workflows.manage', 'budget.manage', 'documents.manage', 'comments.manage', 'dashboards.view', 'reports.view'],
      'Legal/Compliance Officer': ['contracts.manage', 'compliance.manage', 'correspondence.manage', 'documents.manage', 'comments.manage', 'nda.manage', 'insurance.manage', 'env_permits.manage', 'local_content.manage', 'licences.manage', 'dashboards.view', 'reports.view'],
      'Finance/Accounts': ['finance.manage', 'finance.approve', 'budget.manage', 'insurance.manage', 'vendor_payments.manage', 'forex.manage', 'local_content.manage', 'documents.manage', 'comments.manage', 'dashboards.view', 'reports.view'],
      'HSE Officer': ['risks.manage', 'env_permits.manage', 'hse.manage', 'tasks.manage', 'documents.manage', 'comments.manage', 'dashboards.view', 'reports.view'],
      'Geologist/Drilling Engineer': ['dashboards.view', 'reports.view', 'tasks.manage', 'documents.manage', 'comments.manage'],
      'Team Member/Staff': ['dashboards.view', 'reports.view', 'tasks.manage', 'documents.manage', 'comments.manage'],
      'External Partner': ['reports.view'],
      Admin: ['admin.manage_users', 'admin.manage_rbac', 'notifications.manage_rules', 'audit.view', 'reports.manage']
    };

    // Auto-derive each role's `<module>.notify` grants from whatever
    // `<module>.manage` permissions it already has above, instead of
    // duplicating every role's array a second time. Whoever manages a
    // module's records by default also receives its notifications; Admin
    // can subsequently fine-tune either independently via the RBAC Matrix UI
    // (they're separate permission keys, not linked after this initial seed).
    const NOTIFY_PERMISSION_BY_MANAGE_PERMISSION = {
      'activities.manage': 'activities.notify',
      'tasks.manage': 'tasks.notify',
      'licences.manage': 'licences.notify',
      'contracts.manage': 'contracts.notify',
      'compliance.manage': 'compliance.notify',
      'correspondence.manage': 'correspondence.notify',
      'documents.manage': 'documents.notify',
      'budget.manage': 'budget.notify',
      'finance.manage': 'finance.notify',
      'risks.manage': 'risks.notify',
      'insurance.manage': 'insurance.notify',
      'env_permits.manage': 'env_permits.notify',
      'nda.manage': 'nda.notify',
      'vendor_payments.manage': 'vendor_payments.notify',
      'forex.manage': 'forex.notify',
      'local_content.manage': 'local_content.notify',
      'hse.manage': 'hse.notify'
    };
    for (const permissionKeys of Object.values(defaultMatrix)) {
      const derivedNotifyKeys = permissionKeys
        .map((key) => NOTIFY_PERMISSION_BY_MANAGE_PERMISSION[key])
        .filter((key) => key && !permissionKeys.includes(key));
      permissionKeys.push(...derivedNotifyKeys);
    }

    for (const [roleName, permissionKeys] of Object.entries(defaultMatrix)) {
      const role = roleRows[roleName];
      if (!role) continue;

      for (const key of permissionKeys) {
        const permission = permissionRows[key];
        if (!permission) continue;
        await RolePermission.findOrCreate({ where: { roleId: role.id, permissionId: permission.id } });
      }
    }

    // Start the periodic sweep that arms/re-arms/escalates alerts from the rules above.
    const { startNotificationScheduler } = require('./services/notificationScheduler');
    startNotificationScheduler(Number(process.env.NOTIFICATION_ENGINE_INTERVAL_MS) || 60 * 60 * 1000);

    // Start the automated DB backup schedule (Launch Readiness Checklist §1 —
    // "Backup / disaster-recovery plan"). Defaults to a daily cadence.
    const { startBackupScheduler } = require('./services/backupScheduler');
    startBackupScheduler((Number(process.env.DB_BACKUP_INTERVAL_HOURS) || 24) * 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Backend startup error:', err);
    process.exit(1);
  }
};

startServer();