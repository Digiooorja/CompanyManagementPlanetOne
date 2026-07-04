const AuditLog = require('../models/AuditLog');
const { getRequestContext } = require('../middleware/requestContext');

// Models that must never be logged. AuditLog itself is excluded to avoid
// infinite recursion (writing a log would log the log).
const IGNORED_MODELS = new Set(['AuditLog']);

// Field names whose values must never be persisted to the audit trail.
const REDACT_KEYS = new Set(['password']);

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = REDACT_KEYS.has(key) ? '***REDACTED***' : value;
  }
  return out;
}

function actor() {
  const ctx = getRequestContext() || {};
  const user = ctx.user || null;
  return {
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userRole: user?.role ?? null,
    ipAddress: ctx.ip ?? null
  };
}

function modelName(instance) {
  return instance?.constructor?.name || 'Unknown';
}

// Audit logging must never break the underlying operation, so failures are
// swallowed and reported rather than propagated.
async function write(entry) {
  try {
    await AuditLog.create(entry);
  } catch (err) {
    console.error('[audit] failed to write log entry:', err.message);
  }
}

function snapshot(instance) {
  return typeof instance.toJSON === 'function' ? instance.toJSON() : { ...instance.dataValues };
}

function registerAuditHooks(sequelize) {
  sequelize.addHook('afterCreate', async (instance) => {
    const name = modelName(instance);
    if (IGNORED_MODELS.has(name)) return;
    await write({
      ...actor(),
      module: name,
      entityType: name,
      entityId: instance.id != null ? String(instance.id) : null,
      action: 'CREATE',
      oldValue: null,
      newValue: redact(snapshot(instance))
    });
  });

  sequelize.addHook('afterUpdate', async (instance) => {
    const name = modelName(instance);
    if (IGNORED_MODELS.has(name)) return;

    const previous = instance._previousDataValues || {};
    const current = instance.dataValues || {};
    const changedKeys = Object.keys(current).filter(
      (key) => key !== 'updatedAt' && JSON.stringify(previous[key]) !== JSON.stringify(current[key])
    );
    if (changedKeys.length === 0) return;

    const pick = (source) =>
      changedKeys.reduce((acc, key) => {
        acc[key] = source[key];
        return acc;
      }, {});

    await write({
      ...actor(),
      module: name,
      entityType: name,
      entityId: instance.id != null ? String(instance.id) : null,
      action: 'UPDATE',
      oldValue: redact(pick(previous)),
      newValue: redact(pick(current))
    });
  });

  sequelize.addHook('afterDestroy', async (instance) => {
    const name = modelName(instance);
    if (IGNORED_MODELS.has(name)) return;
    await write({
      ...actor(),
      module: name,
      entityType: name,
      entityId: instance.id != null ? String(instance.id) : null,
      action: 'DELETE',
      oldValue: redact(snapshot(instance)),
      newValue: null
    });
  });
}

module.exports = { registerAuditHooks };
