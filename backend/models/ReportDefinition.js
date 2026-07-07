const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Report catalogue (Reports page) — defines what report templates exist,
// their category/frequency/format(s) and which block(s) they cover. This is
// distinct from `Report` (backend/models/Report.js), which stores each
// individual generated report instance/log entry (see the "Recently
// Generated Reports" list and POST /api/reports/definitions/:id/generate).
const ReportDefinition = sequelize.define('ReportDefinition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('Operations', 'Financial', 'HSE', 'Performance'),
    allowNull: false,
    defaultValue: 'Operations'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  frequency: {
    type: DataTypes.ENUM('Weekly', 'Monthly', 'Quarterly'),
    allowNull: false,
    defaultValue: 'Monthly'
  },
  formats: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['PDF']
  },
  block: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'All Blocks'
  },
  lastGeneratedDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'report_definitions',
  timestamps: true
});

module.exports = ReportDefinition;
