const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Structured, periodic operations status log giving management field/project
// visibility at a summary level (Requirements §5.12). Distinct from the
// detailed Daily Drilling/Geological Reports (Phase 2, §7).
const OperationsUpdate = sequelize.define('OperationsUpdate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  blockId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'blocks',
      key: 'id'
    }
  },
  wellName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  keyIssues: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nextSteps: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachmentDocumentIds: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of Document IDs attached to this update',
    get() {
      const raw = this.getDataValue('attachmentDocumentIds');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('attachmentDocumentIds', Array.isArray(value) ? JSON.stringify(value) : value);
    }
  }
}, {
  tableName: 'operations_updates',
  timestamps: true
});

module.exports = OperationsUpdate;
