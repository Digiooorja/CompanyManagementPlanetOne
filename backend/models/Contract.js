const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Central register of all contracts and counterparties (Requirements §5.11).
const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  counterparty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contractType: {
    type: DataTypes.ENUM('Service', 'JV', 'Rig', 'Supply', 'Other'),
    allowNull: false,
    defaultValue: 'Service'
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
  value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  renewalNoticePeriodDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'How many days before expiry the counterparty must be notified of non-renewal'
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Responsible person/team for this contract'
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Active', 'Expired', 'Terminated', 'Renewed'),
    allowNull: false,
    defaultValue: 'Draft'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'contracts',
  timestamps: true
});

module.exports = Contract;
