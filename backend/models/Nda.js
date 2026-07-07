const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// NDA & Data Room Tracker (Phase 2 §7) — tracks NDAs with counterparties.
// Which data-room documents each counterparty may access is tracked
// separately via DataRoomGrant (backend/models/DataRoomGrant.js).
const Nda = sequelize.define('Nda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  counterparty: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ndaType: {
    type: DataTypes.ENUM('Mutual', 'OneWay', 'Standstill'),
    allowNull: false,
    defaultValue: 'Mutual'
  },
  purpose: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  blockId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'blocks',
      key: 'id'
    }
  },
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Responsible person/team for this NDA'
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Active', 'Expired', 'Terminated'),
    allowNull: false,
    defaultValue: 'Draft'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ndas',
  timestamps: true
});

module.exports = Nda;
