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
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Blocked', 'Overdue'),
    defaultValue: 'Not Started'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Percentage complete; rolls up to a parent task when parentTaskId is set (Requirements §5.3)'
  },
  parentTaskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id'
    },
    comment: 'Subtask support — see Requirements §5.3'
  },
  dependencyTaskIds: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of Task IDs this task depends on',
    get() {
      const raw = this.getDataValue('dependencyTaskIds');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('dependencyTaskIds', Array.isArray(value) ? JSON.stringify(value) : value);
    }
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
    type: DataTypes.ENUM('Activity', 'Workflow', 'Document', 'Project', 'Block', 'Decision', 'General'),
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

// Subtask support (Requirements §5.3)
Task.hasMany(Task, {
  foreignKey: 'parentTaskId',
  as: 'subtasks'
});

Task.belongsTo(Task, {
  foreignKey: 'parentTaskId',
  as: 'parentTask'
});

module.exports = Task;
