const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Finance = sequelize.define('Finance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  item: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Income', 'Expense'),
    allowNull: false
  },
  recordType: {
    type: DataTypes.ENUM('Entry', 'Invoice', 'AFE'),
    allowNull: false,
    defaultValue: 'Entry'
  },
  activityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'activities',
      key: 'id'
    }
  },
  approvalDepartment: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Under Review', 'Approved', 'Paid', 'Rejected'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  afeNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transactionDetails: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  actionComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  delegatedTo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  delegationHistory: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('delegationHistory');
      if (!rawValue) return [];
      try {
        return JSON.parse(rawValue);
      } catch {
        return [];
      }
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('delegationHistory', JSON.stringify(value));
      } else {
        this.setDataValue('delegationHistory', value);
      }
    }
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'finances',
  timestamps: true
});

module.exports = Finance;