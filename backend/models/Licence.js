const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Licence = sequelize.define('Licence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  licenceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Official regulatory reference number for this licence'
  },
  licenceType: {
    type: DataTypes.ENUM('Exploration', 'Production', 'Environmental', 'Drilling', 'Contract'),
    allowNull: false,
    defaultValue: 'Exploration'
  },
  // Stores an array of block IDs this licence covers. A licence can span multiple blocks.
  // Pattern mirrors the activityIds field in the Document model.
  blockIds: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of block IDs covered by this licence',
    get() {
      const rawValue = this.getDataValue('blockIds');
      if (!rawValue) return [];
      try {
        return JSON.parse(rawValue);
      } catch {
        return [];
      }
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('blockIds', JSON.stringify(value));
      } else {
        this.setDataValue('blockIds', value);
      }
    }
  },
  issuedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Regulatory authority or government body that issued this licence'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Suspended', 'Renewed'),
    allowNull: false,
    defaultValue: 'Active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Renewal conditions, regulatory notes, or other relevant information'
  },

  // --- Licence Phase Countdown (Requirements §5.9) ---
  phase: {
    type: DataTypes.ENUM('Exploration', 'Extension', 'Appraisal', 'Development', 'Production'),
    allowNull: true,
    comment: 'Current licence phase. Changed only via POST /:id/transition-phase (audited sign-off), never a plain field edit.'
  },
  phaseStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phaseEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Drives the phase countdown (180/90/30-day banners) and Executive Dashboard escalation, mirroring expiryDate'
  },
  minWorkObligation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Minimum work obligation commitments for the current phase (e.g. wells to drill, seismic km, spend commitment)'
  },
  phaseTransitionedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who signed off the most recent phase transition'
  },
  phaseTransitionedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phaseTransitionComment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mandatory sign-off comment recorded at the most recent phase transition'
  }
}, {
  tableName: 'licences',
  timestamps: true
});

module.exports = Licence;
