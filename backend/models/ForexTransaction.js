const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Forex & Banking Workflow (Phase 2 §7) — FX conversions/settlements with a
// maker-checker approval gate before execution. Workflow shape mirrors the
// BudgetLine revision maker-checker pattern (backend/routes/budgetLines.js):
// the requester and approver must be different people (Admin excepted), and
// the status transitions only happen via dedicated action endpoints, never
// a direct PUT.
const ForexTransaction = sequelize.define('ForexTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transactionType: {
    type: DataTypes.ENUM('Spot', 'Forward', 'Transfer'),
    allowNull: false,
    defaultValue: 'Spot'
  },
  fromCurrency: {
    type: DataTypes.ENUM('GHS', 'USD'),
    allowNull: false,
    defaultValue: 'USD'
  },
  toCurrency: {
    type: DataTypes.ENUM('GHS', 'USD'),
    allowNull: false,
    defaultValue: 'GHS'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  rate: {
    type: DataTypes.DECIMAL(12, 6),
    allowNull: false,
    defaultValue: 0
  },
  bank: {
    type: DataTypes.STRING,
    allowNull: true
  },
  valueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  settlementDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  purpose: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Draft', 'PendingApproval', 'Approved', 'Rejected', 'Settled'),
    allowNull: false,
    defaultValue: 'Draft'
  },
  requestedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  requestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  settledById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  settledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  decisionComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Exposed as a Sequelize VIRTUAL attribute (not a real column).
  convertedAmount: {
    type: DataTypes.VIRTUAL,
    get() {
      const amount = Number(this.getDataValue('amount') || 0);
      const rate = Number(this.getDataValue('rate') || 0);
      return Number((amount * rate).toFixed(2));
    }
  }
}, {
  tableName: 'forex_transactions',
  timestamps: true
});

module.exports = ForexTransaction;
