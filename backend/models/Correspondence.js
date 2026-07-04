const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Searchable register of all correspondence with regulators (PC, GNPC, EPA,
// etc.) — inbound and outbound — cross-linked to the document repository
// (Requirements §5.14). Regulator-agnostic and configurable per §15 Assumptions.
const Correspondence = sequelize.define('Correspondence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  direction: {
    type: DataTypes.ENUM('Inbound', 'Outbound'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fromParty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  toParty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  regulator: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g. Petroleum Commission, GNPC, EPA, Ghana Revenue Authority — not hard-coded'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  referenceNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  summary: {
    type: DataTypes.TEXT,
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
  awaitingResponse: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  responseDueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'documents',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Open', 'Closed'),
    allowNull: false,
    defaultValue: 'Open'
  }
}, {
  tableName: 'correspondences',
  timestamps: true
});

module.exports = Correspondence;
