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
  licenceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'licences',
      key: 'id'
    },
    comment: 'Link document to a licence'
  },
  contractId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'contracts',
      key: 'id'
    },
    comment: 'Link document to a contract (governing document / version history)'
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id'
    },
    comment: 'File attachment on a task (Requirements §5.3)'
  },
  insurancePolicyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'insurance_policies',
      key: 'id'
    },
    comment: 'Link document to an insurance policy (Phase 2 §7 Insurance Register)'
  },
  environmentalPermitId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'environmental_permits',
      key: 'id'
    },
    comment: 'Link document to an environmental permit (Phase 2 §7 Environmental Permit Tracker)'
  },
  hseIncidentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'hse_incidents',
      key: 'id'
    },
    comment: 'Link document to an HSE incident, e.g. evidence/photos (Phase 2 §7 HSE Register)'
  },
  blockId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'blocks',
      key: 'id'
    },
    comment: 'Direct block-level link, for documents not tied to a specific project (Requirements §5.5)'
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Document owner — only the owner or Admin may delete (Requirements §5.5 business rule)'
  },
  category: {
    type: DataTypes.ENUM('Contract', 'Letter', 'Notice', 'Report', 'Other'),
    allowNull: false,
    defaultValue: 'Other'
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of free-form tags for folder/tag-based organisation',
    get() {
      const raw = this.getDataValue('tags');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('tags', Array.isArray(value) ? JSON.stringify(value) : value);
    }
  },
  awaitingResponseFrom: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '"Awaiting whose response" field so nothing sits unanswered (Requirements §5.5)'
  },
  responseDueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confidentialityLevel: {
    type: DataTypes.ENUM('Public', 'Internal', 'Confidential'),
    allowNull: false,
    defaultValue: 'Public'
  },
  allowedRoles: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of role names permitted to view a Confidential document',
    get() {
      const raw = this.getDataValue('allowedRoles');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('allowedRoles', Array.isArray(value) ? JSON.stringify(value) : value);
    }
  },
  documentType: {
    type: DataTypes.ENUM('Technical', 'HSE', 'Finance', 'Report', 'Licence', 'Legal'),
    defaultValue: 'Report'
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Under Review', 'Final', 'Superseded'),
    defaultValue: 'Draft'
  }
}, {
  tableName: 'documents',
  timestamps: true
});

module.exports = Document;