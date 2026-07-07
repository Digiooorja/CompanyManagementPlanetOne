const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  generatedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  type: {
    type: DataTypes.ENUM('Project', 'Finance', 'Activity', 'Custom'),
    defaultValue: 'Custom'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  definitionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'report_definitions',
      key: 'id'
    },
    comment: 'Which report catalogue entry (ReportDefinition) this generated instance came from, if any'
  }
}, {
  tableName: 'reports',
  timestamps: true
});

module.exports = Report;