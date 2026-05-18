const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Register = sequelize.define('Register', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  value: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'registers',
  timestamps: true
});

module.exports = Register;