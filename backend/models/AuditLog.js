const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Helper that stores a JSON payload as TEXT and transparently (de)serialises it.
function jsonField(columnName) {
  return {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    get() {
      const raw = this.getDataValue(columnName);
      if (raw == null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    },
    set(value) {
      if (value == null) {
        this.setDataValue(columnName, null);
      } else {
        this.setDataValue(columnName, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }
  };
}

// Immutable, append-only record of every create/update/delete across the system.
// See Requirements §5.4 (Action Database / Audit Log).
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Id of the user who performed the action (null for system/guest)'
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userRole: {
    type: DataTypes.STRING,
    allowNull: true
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Logical module / model the action belongs to'
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Primary key of the affected record'
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
    allowNull: false
  },
  oldValue: jsonField('oldValue'),
  newValue: jsonField('newValue'),
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  // Write-once: entries are never updated, so createdAt is the authoritative timestamp.
  updatedAt: false,
  indexes: [
    { fields: ['module'] },
    { fields: ['entityType', 'entityId'] },
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['createdAt'] }
  ]
});

// Enforce immutability at the ORM layer — no role, including Admin, may edit or
// delete an audit entry (Requirements §5.4 business rule).
const immutable = (verb) => () => {
  throw new Error(`Audit log entries are immutable and cannot be ${verb}`);
};
AuditLog.beforeUpdate(immutable('modified'));
AuditLog.beforeBulkUpdate(immutable('modified'));
AuditLog.beforeDestroy(immutable('deleted'));
AuditLog.beforeBulkDestroy(immutable('deleted'));

module.exports = AuditLog;
