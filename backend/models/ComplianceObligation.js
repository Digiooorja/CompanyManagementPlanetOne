const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Tracks every statutory obligation, licence fee, royalty and regulatory
// filing with due dates, payment status and evidence of completion
// (Requirements §5.7).
const ComplianceObligation = sequelize.define('ComplianceObligation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  regulatoryBody: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Regulator-agnostic and configurable, e.g. GNPC, Ghana Revenue Authority, EPA'
  },
  category: {
    type: DataTypes.ENUM('Tax', 'Licence Fee', 'Royalty', 'Filing', 'Other'),
    allowNull: false,
    defaultValue: 'Other'
  },
  frequency: {
    type: DataTypes.ENUM('One-off', 'Monthly', 'Quarterly', 'Annual'),
    allowNull: false,
    defaultValue: 'One-off'
  },
  blockId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'blocks',
      key: 'id'
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  amountDue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  amountPaid: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  referenceNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  evidenceDocumentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'documents',
      key: 'id'
    },
    comment: 'Mandatory before an overdue obligation can be closed'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Overdue', 'Closed'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  responsibleOfficer: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'compliance_obligations',
  timestamps: true
});

module.exports = ComplianceObligation;
