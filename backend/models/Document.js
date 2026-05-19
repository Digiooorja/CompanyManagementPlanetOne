const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  activityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'activities',
      key: 'id'
    },
    comment: 'Link document to a primary activity'
  },
  activityIds: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of tagged activity IDs for this document',
    get() {
      const rawValue = this.getDataValue('activityIds');
      if (!rawValue) return [];
      try {
        return JSON.parse(rawValue);
      } catch (err) {
        return [];
      }
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('activityIds', JSON.stringify(value));
      } else if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          this.setDataValue('activityIds', Array.isArray(parsed) ? JSON.stringify(parsed) : value);
        } catch {
          this.setDataValue('activityIds', value);
        }
      } else {
        this.setDataValue('activityIds', value);
      }
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: true
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rootDocumentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'documents',
      key: 'id'
    },
    comment: 'Root document in a version chain'
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    },
    comment: 'Link document to a project'
  },
  documentType: {
    type: DataTypes.ENUM('Technical', 'HSE', 'Finance', 'Report'),
    defaultValue: 'Report'
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('Approved', 'Review', 'Rejected'),
    defaultValue: 'Review'
  }
}, {
  tableName: 'documents',
  timestamps: true
});

module.exports = Document;