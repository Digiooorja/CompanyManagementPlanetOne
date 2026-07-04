const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// The many-to-many matrix cell: does Role X hold Permission Y? This table
// IS the "configurable role/permission matrix" required by §4 — Admin edits
// rows here (via /api/admin/role-permissions) instead of a developer editing
// route code.
const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id'
    }
  }
}, {
  tableName: 'role_permissions',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['roleId', 'permissionId'] }
  ]
});

module.exports = RolePermission;
