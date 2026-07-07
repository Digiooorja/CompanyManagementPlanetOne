const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Local Content Tracking (Ghanaian metrics) — Phase 2 §7. Tracks Ghanaian
// local-content commitments vs. actuals (spend/employment/procurement/
// training/technology-transfer %) per block/period, for Petroleum
// Commission reporting.
const LocalContentRecord = sequelize.define('LocalContentRecord', {
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
  period: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Reporting period, e.g. "2026-Q2"'
  },
  metric: {
    type: DataTypes.ENUM('LocalSpend', 'LocalEmployment', 'LocalProcurement', 'Training', 'TechnologyTransfer'),
    allowNull: false,
    defaultValue: 'LocalSpend'
  },
  committedPercent: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0
  },
  actualPercent: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0
  },
  committedValue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  actualValue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.ENUM('GHS', 'USD'),
    allowNull: false,
    defaultValue: 'GHS'
  },
  narrative: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reportingStatus: {
    type: DataTypes.ENUM('Draft', 'Submitted', 'Approved'),
    allowNull: false,
    defaultValue: 'Draft'
  },
  regulator: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Petroleum Commission'
  },
  // Exposed as a Sequelize VIRTUAL attribute (not a real column) so the
  // generic Notification Engine's ThresholdBased evaluator — which reads
  // values via `record.get(field)` — can alert on shortfalls crossing 5%/10%
  // with no engine changes, mirroring Finance.utilisationPercent / Risk.riskScore.
  shortfallPercent: {
    type: DataTypes.VIRTUAL,
    get() {
      const committed = Number(this.getDataValue('committedPercent') || 0);
      const actual = Number(this.getDataValue('actualPercent') || 0);
      return Math.max(0, Number((committed - actual).toFixed(2)));
    }
  }
}, {
  tableName: 'local_content_records',
  timestamps: true
});

module.exports = LocalContentRecord;
