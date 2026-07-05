const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Singleton row (id=1) holding the Admin-configurable Risk Register scoring
// matrix — the Low/Medium/High weight values multiplied together to derive
// `Risk.riskScore`, and the thresholds that map a score to a Low/Medium/High
// `Risk.riskBand` (Requirements §5.15 "configurable matrix"). Read into an
// in-process cache at startup — see backend/config/riskMatrix.js.
const RiskMatrixSetting = sequelize.define('RiskMatrixSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lowWeight: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  mediumWeight: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2
  },
  highWeight: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3
  },
  mediumThreshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
    comment: 'Score >= this value is at least the Medium band'
  },
  highThreshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7,
    comment: 'Score >= this value is the High band'
  }
}, {
  tableName: 'risk_matrix_settings',
  timestamps: true
});

module.exports = RiskMatrixSetting;
