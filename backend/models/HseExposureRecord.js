const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Stores exposure (man-)hours actually worked, so TRIR/LTIF (GET /api/hse/metrics)
// can be calculated from real recorded data instead of a number typed into the
// UI ad-hoc on every page view. One row = one reporting period (e.g. a month)
// for a given block (or portfolio-wide when blockId is null).
const HseExposureRecord = sequelize.define('HseExposureRecord', {
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
    },
    comment: 'Null = portfolio-wide exposure hours not tied to a single block'
  },
  periodLabel: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Free-text reporting period, e.g. "2026-06" or "Q2 2026"'
  },
  periodStart: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  periodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  manHours: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total exposure man-hours actually worked in this period (from HR/payroll/timesheet data)'
  },
  recordedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'hse_exposure_records',
  timestamps: true
});

module.exports = HseExposureRecord;
