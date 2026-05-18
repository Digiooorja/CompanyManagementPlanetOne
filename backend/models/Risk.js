const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Risk = sequelize.define('Risk', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    },
    comment: 'Link risk to a project'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  probability: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Mitigated', 'Closed'),
    defaultValue: 'Active'
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Risk owner name'
  },
  mitigation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mitigation strategy'
  }
}, {
  tableName: 'risks',
  timestamps: true
});

module.exports = Risk;
