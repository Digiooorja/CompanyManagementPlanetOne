const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Work Programme & Budget Tracker line item (Requirements §5.6). A single
// line couples the work-programme schedule (planned vs. actual dates) with
// its budget (approved/committed/actual spend by category) for a block,
// optionally tied to a specific Activity.
const BudgetLine = sequelize.define('BudgetLine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  blockId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'blocks',
      key: 'id'
    }
  },
  activityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'activities',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  budgetCategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  plannedStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  plannedEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currency: {
    type: DataTypes.ENUM('GHS', 'USD'),
    allowNull: false,
    defaultValue: 'USD'
  },
  approvedBudget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  committed: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  actualSpend: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  // Stored (not virtual) so it can be queried/exported directly; kept in
  // sync by the beforeSave hook below whenever the money fields change.
  variancePercent: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '((actualSpend - approvedBudget) / approvedBudget) * 100'
  },
  responsiblePerson: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Active', 'Closed'),
    allowNull: false,
    defaultValue: 'Draft'
  },
  // --- Maker-checker workflow for budget revisions (§5.6 business rule) ---
  revisionStatus: {
    type: DataTypes.ENUM('None', 'PendingApproval', 'Approved', 'Rejected'),
    allowNull: false,
    defaultValue: 'None'
  },
  pendingApprovedBudget: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: 'Proposed new approvedBudget awaiting checker approval'
  },
  revisionRequestedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  revisionRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  revisionDecidedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  revisionDecidedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  revisionComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Absolute variance and utilisation are exposed as Sequelize VIRTUAL
  // attributes (not real columns) so the generic Notification Engine's
  // ThresholdBased evaluator — which reads values via `record.get(field)` —
  // can alert on them symmetrically (±threshold) and on budget exhaustion,
  // without any engine code changes (§10.4).
  absVariancePercent: {
    type: DataTypes.VIRTUAL,
    get() {
      return Math.abs(Number(this.getDataValue('variancePercent') || 0));
    }
  },
  utilisationPercent: {
    type: DataTypes.VIRTUAL,
    get() {
      const approved = Number(this.getDataValue('approvedBudget') || 0);
      if (approved <= 0) return 0;
      const committed = Number(this.getDataValue('committed') || 0);
      const actual = Number(this.getDataValue('actualSpend') || 0);
      return Number((((committed + actual) / approved) * 100).toFixed(2));
    }
  }
}, {
  tableName: 'budget_lines',
  timestamps: true,
  hooks: {
    beforeSave: (line) => {
      const approved = Number(line.approvedBudget || 0);
      const actual = Number(line.actualSpend || 0);
      line.variancePercent = approved > 0 ? Number((((actual - approved) / approved) * 100).toFixed(2)) : 0;
    }
  }
});

module.exports = BudgetLine;
