const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Completed'),
    defaultValue: 'Active'
  },
  parentActivityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'activities',
      key: 'id'
    },
    comment: 'Parent activity ID for sub-activities'
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    allowNull: true
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  plannedStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Planned start date for the activity'
  },
  plannedEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Planned end date for the activity'
  },
  actualStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Actual start date for the activity'
  },
  actualEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Actual end date for the activity'
  },
  plannedCost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Planned cost for the activity'
  },
  actualCost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Actual cost for the activity'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'activities',
  timestamps: true
});

// Define associations
Activity.hasMany(Activity, {
  foreignKey: 'parentActivityId',
  as: 'subActivities'
});

Activity.belongsTo(Activity, {
  foreignKey: 'parentActivityId',
  as: 'parentActivity'
});

// Association with Project (avoid circular dependency by not requiring Project here)
// The association will be defined in server initialization after all models are loaded

module.exports = Activity;