const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// A business role from the RBAC matrix (Requirements §4). Unlike the old
// hard-coded User.role ENUM, roles are rows in this table so Admin can add,
// rename or retire roles — and adjust their permissions — without a code
// change. `isSystem` roles (Admin, Manager, User) back the legacy
// adminMiddleware/managerMiddleware checks and cannot be renamed or deleted.
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'System roles (Admin, Manager, User) cannot be renamed or deleted — legacy middleware depends on their names'
  }
}, {
  tableName: 'roles',
  timestamps: true
});

module.exports = Role;
