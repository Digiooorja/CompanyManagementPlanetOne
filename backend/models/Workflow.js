const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Workflow = sequelize.define('Workflow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  steps: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Completed'),
    defaultValue: 'Active'
  }
}, {
  tableName: 'workflows',
  timestamps: true
});

module.exports = Workflow;