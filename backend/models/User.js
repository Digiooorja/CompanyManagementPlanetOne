const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  employeeId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'Business-facing employee identifier (Requirements §5.1)'
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reportingManagerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Direct manager — drives the auto-generated org chart (Requirements §5.1)'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qualifications: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date joined (Requirements §5.1)'
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'User',
    comment: 'References Role.name — kept as a plain string (not a DB ENUM) so Admin can add new roles via /api/admin/roles without a schema migration'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Reporting line for the auto-generated org chart (Requirements §5.1)
User.belongsTo(User, {
  foreignKey: 'reportingManagerId',
  as: 'reportingManager'
});

User.hasMany(User, {
  foreignKey: 'reportingManagerId',
  as: 'directReports'
});

module.exports = User;