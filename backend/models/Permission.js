const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// A single grantable capability in the RBAC matrix, e.g. "contracts.manage".
// The permission catalog itself is fixed (it mirrors what the API actually
// enforces), but which roles hold which permissions is fully configurable
// via the `role_permissions` join table.
const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Dot-notation permission key checked by requirePermission(), e.g. "contracts.manage"'
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Human-readable module grouping shown in the Admin RBAC matrix UI'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'permissions',
  timestamps: true
});

module.exports = Permission;
