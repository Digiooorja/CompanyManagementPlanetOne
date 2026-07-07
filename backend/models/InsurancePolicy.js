const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Insurance Register (Phase 2 §7) — tracks insurance policies, coverage and
// renewal deadlines across the portfolio. Structurally a near-clone of the
// Contract Register (§5.11) — see backend/models/Contract.js.
const InsurancePolicy = sequelize.define('InsurancePolicy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  policyNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  insurer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  broker: {
    type: DataTypes.STRING,
    allowNull: true
  },
  policyType: {
    type: DataTypes.ENUM('Property', 'Liability', 'WellControl', 'Marine', 'BusinessInterruption', 'Other'),
    allowNull: false,
    defaultValue: 'Other'
  },
  blockId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'blocks',
      key: 'id'
    }
  },
  coverageAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.ENUM('GHS', 'USD'),
    allowNull: false,
    defaultValue: 'USD'
  },
  premium: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  renewalNoticePeriodDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'How many days before expiry the broker/insurer must be notified of non-renewal'
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Responsible person/team for this policy'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Expired', 'Cancelled', 'Renewed'),
    allowNull: false,
    defaultValue: 'Active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'insurance_policies',
  timestamps: true
});

module.exports = InsurancePolicy;
