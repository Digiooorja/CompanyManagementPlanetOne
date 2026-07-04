const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Admin-configurable rule that drives the shared Notification & Alert Engine
// (Requirements §10.4 — "Admin can configure default lead times, escalation
// grace periods and channel preferences per module, without a code change").
// The engine (services/notificationEngine.js) reads active rules and evaluates
// them against live records; it never hard-codes per-module reminder logic.
const NotificationRule = sequelize.define('NotificationRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Source module this rule watches, e.g. Activity, Licence, Finance, Task'
  },
  triggerType: {
    type: DataTypes.ENUM('DateBased', 'ThresholdBased', 'StatusBased', 'Recurring'),
    allowNull: false
  },
  // DateBased config
  dateField: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Field on the source model holding the relevant date, e.g. dueDate, expiryDate'
  },
  leadTimeDays: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of day thresholds before the date to fire an alert, e.g. [90,60,30]',
    get() {
      const raw = this.getDataValue('leadTimeDays');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('leadTimeDays', Array.isArray(value) ? JSON.stringify(value) : value);
    }
  },
  // ThresholdBased config
  thresholdField: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Numeric field/expression watched for threshold breaches, e.g. utilisationPercent'
  },
  thresholdValues: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of numeric thresholds to alert on, e.g. [80,100]',
    get() {
      const raw = this.getDataValue('thresholdValues');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('thresholdValues', Array.isArray(value) ? JSON.stringify(value) : value);
    }
  },
  // StatusBased config
  statusField: {
    type: DataTypes.STRING,
    allowNull: true
  },
  statusValue: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Shared config
  recurrenceIntervalHours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 24,
    comment: 'How often an unresolved alert re-arms (re-appears) while open'
  },
  escalationGraceHours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Hours after breach before escalating to a supervisor/admin'
  },
  priority: {
    type: DataTypes.ENUM('Critical', 'High', 'Medium', 'Low'),
    allowNull: false,
    defaultValue: 'Medium'
  },
  channels: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '["InApp"]',
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
  messageTemplate: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Supports {{field}} placeholders resolved against the source record'
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'notification_rules',
  timestamps: true
});

module.exports = NotificationRule;
