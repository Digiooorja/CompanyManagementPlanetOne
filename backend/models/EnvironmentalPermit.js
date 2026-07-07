const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Environmental Permit Tracker (Phase 2 §7) — tracks EPA Ghana permits/
// approvals, their conditions, and renewal deadlines. Same expiry-countdown
// shape as the Contract/Insurance registers.
const EnvironmentalPermit = sequelize.define('EnvironmentalPermit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  permitNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  permitType: {
    type: DataTypes.ENUM('EIA', 'EPAPermit', 'DischargeConsent', 'WasteDisposal', 'Other'),
    allowNull: false,
    defaultValue: 'EPAPermit'
  },
  regulator: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'EPA Ghana'
  },
  blockId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'blocks',
      key: 'id'
    }
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  conditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Free-text permit conditions/obligations'
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Responsible person/team for this permit'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Expired', 'Suspended', 'Renewed'),
    allowNull: false,
    defaultValue: 'Active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'environmental_permits',
  timestamps: true
});

module.exports = EnvironmentalPermit;
