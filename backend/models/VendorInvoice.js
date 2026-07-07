const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Vendor Payment Aging (Phase 2 §7) — tracks outstanding vendor invoices and
// their aging buckets to surface overdue payables. A dedicated model (rather
// than overloading Finance/recordType='Invoice') per the Phase 2 dev plan.
const VendorInvoice = sequelize.define('VendorInvoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vendor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  invoiceNumber: {
    type: DataTypes.STRING,
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
  financeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'finances',
      key: 'id'
    },
    comment: 'Optional link to the Finance/Invoice payment record raised against this vendor invoice'
  },
  invoiceDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.ENUM('GHS', 'USD'),
    allowNull: false,
    defaultValue: 'USD'
  },
  amountPaid: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Open', 'PartiallyPaid', 'Paid', 'Disputed'),
    allowNull: false,
    defaultValue: 'Open'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // outstandingAmount/daysOutstanding/agingBucket are Sequelize VIRTUAL
  // attributes (not real columns) so the generic Notification Engine's
  // ThresholdBased evaluator — which reads values via `record.get(field)` —
  // can alert on aging crossing 30/60/90 days with no engine changes,
  // mirroring the existing Finance.utilisationPercent / Risk.riskScore pattern.
  outstandingAmount: {
    type: DataTypes.VIRTUAL,
    get() {
      const amount = Number(this.getDataValue('amount') || 0);
      const paid = Number(this.getDataValue('amountPaid') || 0);
      return Number((amount - paid).toFixed(2));
    }
  },
  daysOutstanding: {
    type: DataTypes.VIRTUAL,
    get() {
      if (this.getDataValue('status') === 'Paid') return 0;
      const due = this.getDataValue('dueDate');
      if (!due) return 0;
      const diffMs = Date.now() - new Date(due).getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
  },
  agingBucket: {
    type: DataTypes.VIRTUAL,
    get() {
      const days = this.daysOutstanding;
      if (days <= 0) return 'Current';
      if (days <= 30) return '0-30';
      if (days <= 60) return '31-60';
      if (days <= 90) return '61-90';
      return '90+';
    }
  }
}, {
  tableName: 'vendor_invoices',
  timestamps: true
});

module.exports = VendorInvoice;
