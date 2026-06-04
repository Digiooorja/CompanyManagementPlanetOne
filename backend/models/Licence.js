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
  }
}, {
  tableName: 'licences',
  timestamps: true
});

module.exports = Licence;
