const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// HSE Register (Phase 2 §7) — logs HSE incidents/observations, drives
// corrective actions to closure, and feeds TRIR/LTIF safety metrics
// (GET /api/hse/metrics).
const HseIncident = sequelize.define('HseIncident', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  blockId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'blocks',
      key: 'id'
    }
  },
  incidentType: {
    type: DataTypes.ENUM('Injury', 'NearMiss', 'Spill', 'Observation', 'Fire', 'Other'),
    allowNull: false,
    defaultValue: 'Observation'
  },
  severity: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    allowNull: false,
    defaultValue: 'Low'
  },
  occurredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reportedBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  immediateAction: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rootCause: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Required (with correctiveAction) before the incident can be closed — see POST /:id/close'
  },
  correctiveAction: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Required (with rootCause) before the incident can be closed — see POST /:id/close'
  },
  actionOwner: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Person responsible for the corrective action'
  },
  actionDueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Open', 'UnderInvestigation', 'ActionPending', 'Closed'),
    allowNull: false,
    defaultValue: 'Open'
  },
  manHoursLost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  isRecordable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  closedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Exposed as a Sequelize VIRTUAL attribute (not a real column) so the
  // generic Notification Engine's ThresholdBased evaluator — which reads
  // values via `record.get(field)` — can escalate overdue corrective
  // actions with no engine changes, mirroring Finance.utilisationPercent /
  // Risk.riskScore / VendorInvoice.daysOutstanding.
  daysOverdue: {
    type: DataTypes.VIRTUAL,
    get() {
      if (this.getDataValue('status') === 'Closed') return 0;
      const due = this.getDataValue('actionDueDate');
      if (!due) return 0;
      const diffMs = Date.now() - new Date(due).getTime();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }
}, {
  tableName: 'hse_incidents',
  timestamps: true
});

module.exports = HseIncident;
