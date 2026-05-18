const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Block = sequelize.define('Block', {
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
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Completed'),
    defaultValue: 'Active'
  },
  licenceStart: {
    type: DataTypes.DATE,
    allowNull: true
  },
  licenceExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  operator: {
    type: DataTypes.STRING,
    allowNull: true
  },
  workingInterest: {
    type: DataTypes.STRING,
    allowNull: true
  },
  area: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
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
  tableName: 'blocks',
  timestamps: true
});

module.exports = Block;