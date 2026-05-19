const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Workflow = sequelize.define('Workflow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  submittedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  submitDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currentStep: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  steps: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Awaiting Action'
  }
}, {
  tableName: 'workflows',
  timestamps: true
});

module.exports = Workflow;