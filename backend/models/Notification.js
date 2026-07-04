const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// The shared Notification & Alert Engine record (Requirements §5.2 / §10).
// A single row represents one alert instance targeted at one recipient.
// Recurring alerts reuse the same row (dedupeKey) and are "re-armed" by
// resetting status back to Pending — this is what makes the in-app pop-up
// reappear every login/interval until the user marks it Done or snoozes it.
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Info', 'Warning', 'Error', 'Success'),
    defaultValue: 'Info'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Recipient of this alert'
  },

  // --- Notification & Alert Engine fields (§10) ---
  module: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Source module/model this alert was raised for, e.g. Activity, Licence, Finance, Task'
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Primary key of the source record within its module'
  },
  triggerType: {
    type: DataTypes.ENUM('DateBased', 'ThresholdBased', 'StatusBased', 'Recurring', 'Manual'),
    allowNull: false,
    defaultValue: 'Manual'
  },
  priority: {
    type: DataTypes.ENUM('Critical', 'High', 'Medium', 'Low'),
    allowNull: false,
    defaultValue: 'Medium'
  },
  channels: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of delivery channels, e.g. ["InApp","Email","SMS"]',
    get() {
      const raw = this.getDataValue('channels');
      if (!raw) return ['InApp'];
      try {
        return JSON.parse(raw);
      } catch {
        return ['InApp'];
      }
    },
    set(value) {
      this.setDataValue('channels', Array.isArray(value) ? JSON.stringify(value) : value);
    }
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Acknowledged', 'Snoozed', 'Escalated', 'Dismissed'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  dueAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'The deadline/threshold-crossing moment this alert concerns'
  },
  dedupeKey: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'module|entityType|entityId|triggerType|bucket — prevents duplicate alert instances'
  },
  recurrenceIntervalHours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'How often (in hours) this alert re-arms itself while unresolved'
  },
  lastSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  snoozeUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  snoozeReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mandatory when priority is Critical (Requirements §5.2 business rule)'
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  acknowledgedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User id who acknowledged/marked the alert Done'
  },
  escalatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  escalatedToUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'status'] },
    { fields: ['module', 'entityType', 'entityId'] },
    { fields: ['dedupeKey'] },
    { fields: ['status', 'priority'] }
  ]
});

module.exports = Notification;
