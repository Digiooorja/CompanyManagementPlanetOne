const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// A chronological, searchable record of key decisions, decision-makers and
// rationale, supporting governance traceability (Requirements §5.13).
const Decision = sequelize.define('Decision', {
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
  meetingContext: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  decisionMakers: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Comma-separated names of the decision maker(s)'
  },
  rationale: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  linkedRiskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'risks',
      key: 'id'
    }
  },
  linkedActivityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'activities',
      key: 'id'
    }
  },
  linkedTaskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Open', 'In Progress', 'Closed'),
    allowNull: false,
    defaultValue: 'Open'
  }
}, {
  tableName: 'decisions',
  timestamps: true
});

module.exports = Decision;
