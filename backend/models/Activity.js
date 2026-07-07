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
  linkedMilestone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'The critical event this activity counts down to, e.g. "Drilling Commencement" (Requirements §5.2)'
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
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Display order for activities in the same project/parent'
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
  timestamps: true,
  hooks: {
    // Requirements §5.2/§5.3 business rule: progress moving off 0% marks the
    // activity as actually started (if not already recorded); reaching 100%
    // marks it Completed with an actual end date (if not already recorded).
    // Runs for every create/update, including the automatic parent-progress
    // roll-up in routes/activities.js (bulk `Activity.update()` calls there
    // pass `individualHooks: true` specifically so this still fires).
    beforeSave: (activity) => {
      if (!activity.changed('progress')) return;

      const newProgress = Number(activity.progress) || 0;
      const previousProgress = activity.isNewRecord ? 0 : Number(activity.previous('progress')) || 0;

      if (previousProgress <= 0 && newProgress > 0 && !activity.actualStartDate) {
        activity.actualStartDate = new Date();
      }

      if (newProgress >= 100) {
        if (!activity.actualEndDate) {
          activity.actualEndDate = new Date();
        }
        activity.status = 'Completed';
      }
    }
  }
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