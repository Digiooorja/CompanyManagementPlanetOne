const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// A single "this counterparty may access this document" grant under an NDA
// (Phase 2 §7 NDA & Data Room Tracker). Revocation is soft (`revokedAt`) so
// access history remains auditable rather than being hard-deleted.
const DataRoomGrant = sequelize.define('DataRoomGrant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ndaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ndas',
      key: 'id'
    }
  },
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'documents',
      key: 'id'
    }
  },
  accessLevel: {
    type: DataTypes.ENUM('View', 'Download'),
    allowNull: false,
    defaultValue: 'View'
  },
  grantedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'data_room_grants',
  timestamps: true
});

module.exports = DataRoomGrant;
