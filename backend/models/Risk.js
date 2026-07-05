const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const { computeScore, computeBand } = require('../config/riskMatrix');

const Risk = sequelize.define('Risk', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    },
    comment: 'Link risk to a project'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  probability: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Mitigated', 'Closed'),
    defaultValue: 'Active'
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Risk owner name'
  },
  mitigation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mitigation strategy'
  },
  reviewDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Next scheduled review date — drives the review-date reminder (§5.15)'
  },
  // riskScore/riskBand are Sequelize VIRTUAL attributes (not real columns),
  // computed from severity × probability against the Admin-configurable
  // matrix (backend/config/riskMatrix.js). Exposing them as VIRTUAL fields
  // means the generic Notification Engine's ThresholdBased evaluator — which
  // reads values via `record.get(field)` — can alert on high-band risks
  // without any engine code changes, mirroring the existing
  // utilisationPercent/absVariancePercent pattern on Finance (§10.4).
  riskScore: {
    type: DataTypes.VIRTUAL,
    get() {
      return computeScore(this.getDataValue('severity'), this.getDataValue('probability'));
    }
  },
  riskBand: {
    type: DataTypes.VIRTUAL,
    get() {
      const score = computeScore(this.getDataValue('severity'), this.getDataValue('probability'));
      return computeBand(score);
    }
  }
}, {
  tableName: 'risks',
  timestamps: true
});

module.exports = Risk;
