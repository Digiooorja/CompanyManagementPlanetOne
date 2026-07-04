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
    type: DataTypes.ENUM('Pending', 'Under Review', 'Approved', 'Paid', 'Rejected', 'Closed'),
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
  // --- AFE Tracking fields (Requirements §5.10) — only meaningful when recordType='AFE' ---
  afeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'finances', key: 'id' },
    comment: 'For Invoice/Entry rows: the AFE this payment is drawn against, for automatic actuals aggregation'
  },
  parentAfeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'finances', key: 'id' },
    comment: 'For supplementary AFEs: the original AFE this supplements'
  },
  supplementNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0 = original AFE; 1, 2, ... for supplementary AFEs'
  },
  committedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  actualToDate: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Auto-aggregated from linked Paid Invoice/Entry rows via afeId'
  },
  variancePercent: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '((actualToDate - amount) / amount) * 100, where amount is the Authorised Amount for AFE rows'
  },
  approvalDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvingAuthority: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reconciledById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  reconciledAt: {
    type: DataTypes.DATE,
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
  },
  // Utilisation and absolute variance are exposed as Sequelize VIRTUAL
  // attributes (not real columns) so the generic Notification Engine's
  // ThresholdBased evaluator — which reads values via `record.get(field)` —
  // can alert on AFE utilisation crossing 80%/100% without any engine code
  // changes (§10.4).
  utilisationPercent: {
    type: DataTypes.VIRTUAL,
    get() {
      const authorised = Number(this.getDataValue('amount') || 0);
      if (authorised <= 0) return 0;
      const committed = Number(this.getDataValue('committedAmount') || 0);
      const actual = Number(this.getDataValue('actualToDate') || 0);
      return Number((((committed + actual) / authorised) * 100).toFixed(2));
    }
  },
  absVariancePercent: {
    type: DataTypes.VIRTUAL,
    get() {
      return Math.abs(Number(this.getDataValue('variancePercent') || 0));
    }
  }
}, {
  tableName: 'finances',
  timestamps: true,
  hooks: {
    beforeSave: (record) => {
      if (record.recordType !== 'AFE') return;
      const authorised = Number(record.amount || 0);
      const actual = Number(record.actualToDate || 0);
      record.variancePercent = authorised > 0 ? Number((((actual - authorised) / authorised) * 100).toFixed(2)) : 0;
    }
  }
});

// Supplementary AFE chain and payment-to-AFE linkage (Requirements §5.10)
Finance.belongsTo(Finance, { foreignKey: 'parentAfeId', as: 'parentAfe' });
Finance.hasMany(Finance, { foreignKey: 'parentAfeId', as: 'supplementaryAfes' });
Finance.belongsTo(Finance, { foreignKey: 'afeId', as: 'governingAfe' });
Finance.hasMany(Finance, { foreignKey: 'afeId', as: 'linkedPayments' });

module.exports = Finance;