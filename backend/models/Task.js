const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Blocked'),
    defaultValue: 'Not Started'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  relatedType: {
    type: DataTypes.ENUM('Activity', 'Workflow', 'Document', 'Project', 'General'),
    defaultValue: 'General'
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'tasks',
  timestamps: true
});

module.exports = Task;
