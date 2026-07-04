const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Document = require('../models/Document');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const Block = require('../models/Block');
const multer = require('multer');
const AWS = require('aws-sdk');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION_NAME || process.env.AWS_REGION
});

function sanitizeSegment(name) {
  if (!name) return 'unknown';
  return String(name).trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-_.]/g, '').toLowerCase();
}

// Confidential documents are restricted to named roles only (Requirements
// §5.5 business rule). Admin and the document owner always have access.
function canViewDocument(user, doc) {
  if (doc.confidentialityLevel !== 'Confidential') return true;
  if (!user) return false;
  if (user.role === 'Admin') return true;
  if (doc.ownerId && user.id === doc.ownerId) return true;
  const allowedRoles = Array.isArray(doc.allowedRoles) ? doc.allowedRoles : [];
  return allowedRoles.includes(user.role);
}

// GET all documents
router.get('/', async (req, res) => {
  try {
    const { projectId, activityId, licenceId, taskId, category, blockId } = req.query;
    const where = {};

    if (projectId) {
      where.projectId = projectId;
    }
    if (activityId) {
      where.activityId = activityId;
    }
    if (licenceId) {
      where.licenceId = licenceId;
    }
    if (taskId) {
      where.taskId = taskId;
    }
    if (category) {
      where.category = category;
    }
    if (blockId) {
      where.blockId = blockId;
    }

    const documents = await Document.findAll({ where });
    let documentData = documents
      .filter((doc) => canViewDocument(req.user, doc))
      .map((doc) => doc.toJSON());

    if (activityId) {
      documentData = documentData.filter((doc) => {
        const taggedIds = Array.isArray(doc.activityIds) ? doc.activityIds : [];
        return Number(doc.activityId) === Number(activityId) || taggedIds.includes(Number(activityId));
      });
    }

    const allActivityIds = Array.from(
      new Set(
        documentData.flatMap((doc) => {
          const ids = Array.isArray(doc.activityIds) ? doc.activityIds : [];
          return doc.activityId ? [...ids, Number(doc.activityId)] : ids;
        })
      )
    );

    if (allActivityIds.length > 0) {
      const activityRecords = await Activity.findAll({
        where: { id: allActivityIds }
      });
      const activityMap = activityRecords.reduce((map, activity) => {
        map[activity.id] = activity.name || activity.title || `Activity ${activity.id}`;
        return map;
      }, {});

      documentData = documentData.map((doc) => {
        const allIds = Array.isArray(doc.activityIds) ? doc.activityIds.slice() : [];
        if (doc.activityId) {
          allIds.unshift(Number(doc.activityId));
        }
        return {
          ...doc,
          activityTags: allIds.map((activityId) => activityMap[activityId] || `Activity ${activityId}`)
        };
      });
    }

    // Pre-populate missing projectId from activity records if available
    const documentsWithMissingProject = documentData.filter(doc => !doc.projectId && doc.activityId);
    if (documentsWithMissingProject.length > 0) {
      const actIds = documentsWithMissingProject.map(doc => doc.activityId);
      const activityRecordsForProject = await Activity.findAll({ where: { id: actIds } });
      const activityProjectMap = activityRecordsForProject.reduce((map, act) => {
        map[act.id] = act.projectId;
        return map;
      }, {});
      documentData = documentData.map(doc => {
        if (!doc.projectId && doc.activityId && activityProjectMap[doc.activityId]) {
          return {
            ...doc,
            projectId: activityProjectMap[doc.activityId]
          };
        }
        return doc;
      });
    }

    // Enrich with projects and blocks
    const allProjectIds = Array.from(new Set(documentData.map(doc => doc.projectId).filter(Boolean)));
    const projectRecords = await Project.findAll({ where: { id: allProjectIds } });
    const projectMap = projectRecords.reduce((map, p) => {
      map[p.id] = p;
      return map;
    }, {});

    const allBlockIds = Array.from(new Set(projectRecords.map(p => p.blockId).filter(Boolean)));
    const blockRecords = await Block.findAll({ where: { id: allBlockIds } });
    const blockMap = blockRecords.reduce((map, b) => {
      map[b.id] = b.name;
      return map;
    }, {});

    documentData = documentData.map((doc) => {
      let projectName = 'General';
      let blockName = 'General';
      if (doc.projectId && projectMap[doc.projectId]) {
        projectName = projectMap[doc.projectId].name;
        const blockId = projectMap[doc.projectId].blockId;
        if (blockId && blockMap[blockId]) {
          blockName = blockMap[blockId];
        }
      }
      return {
        ...doc,
        projectName,
        project: projectName,
        blockName,
        block: blockName
      };
    });

    res.json(documentData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET document by ID
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (!canViewDocument(req.user, document)) {
      return res.status(403).json({ message: 'This document is Confidential and restricted to named roles only' });
    }

    const documentData = document.toJSON();

    if (documentData.activityId && !documentData.projectId) {
      const activity = await Activity.findByPk(documentData.activityId);
      if (activity && activity.projectId) {
        documentData.projectId = activity.projectId;
      }
    }

    if (documentData.projectId) {
      const project = await Project.findByPk(documentData.projectId);
      if (project) {
        documentData.projectName = project.name;
        documentData.project = project.name;
        if (project.blockId) {
          const block = await Block.findByPk(project.blockId);
          if (block) {
            documentData.blockName = block.name;
            documentData.block = block.name;
          }
        }
      }
    }

    const taggedActivityIds = Array.isArray(documentData.activityIds)
      ? documentData.activityIds
      : [];

    const activityIdsToResolve = [...taggedActivityIds];
    if (documentData.activityId) {
      activityIdsToResolve.push(Number(documentData.activityId));
    }

    if (activityIdsToResolve.length > 0) {
      const taggedActivities = await Activity.findAll({
        where: {
          id: activityIdsToResolve
        }
      });
      const activityMap = taggedActivities.reduce((map, activity) => {
        map[activity.id] = activity.name || activity.title || `Activity ${activity.id}`;
        return map;
      }, {});

      const allIds = Array.isArray(documentData.activityIds) ? documentData.activityIds.slice() : [];
      if (documentData.activityId) {
        allIds.unshift(Number(documentData.activityId));
      }

      documentData.activityTags = allIds.map((activityId) => activityMap[activityId] || `Activity ${activityId}`);
    } else {
      documentData.activityTags = [];
    }

    const rootDocumentId = documentData.rootDocumentId || documentData.id;
    const allVersions = await Document.findAll({
      where: {
        [Op.or]: [
          { id: rootDocumentId },
          { rootDocumentId }
        ]
      },
      order: [['versionNumber', 'ASC']]
    });

    documentData.versions = allVersions.map((version) => version.toJSON());
    res.json(documentData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a presigned URL for download or preview
router.get('/:id/presigned', async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (!document.s3Key) return res.status(400).json({ message: 'Document file location not available' });

    const type = req.query.type === 'preview' ? 'preview' : 'download';
    const bucket = process.env.AWS_STORAGE_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
    const filename = document.filename || document.title || `document-${document.id}`;
    const dispositionType = type === 'download' ? 'attachment' : 'inline';
    const encodedFilename = encodeURIComponent(filename).replace(/\+/g, '%20');

    const params = {
      Bucket: bucket,
      Key: document.s3Key,
      Expires: 300,
      ResponseContentType: document.mimeType || 'application/octet-stream',
      ResponseContentDisposition: `${dispositionType}; filename="${encodedFilename}"`
    };

    const url = await new Promise((resolve, reject) => {
      s3.getSignedUrl('getObject', params, (err, signedUrl) => {
        if (err) return reject(err);
        resolve(signedUrl);
      });
    });

    res.json({ url, expiresIn: 300 });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST new document with file upload (field: file). Accepts activityId, projectId, or licenceId.
router.post('/', upload.single('file'), async (req, res) => {
  try {
    let {
      title, author, projectId, activityId, activityIds, licenceId, taskId, blockId, documentType, status,
      category, tags, awaitingResponseFrom, responseDueDate, confidentialityLevel, allowedRoles
    } = req.body;

    const parsedActivityIds = (() => {
      if (!activityIds) return [];
      if (Array.isArray(activityIds)) return activityIds.map((id) => Number(id));
      try {
        const parsed = JSON.parse(activityIds);
        return Array.isArray(parsed) ? parsed.map((id) => Number(id)) : [Number(activityIds)];
      } catch {
        return String(activityIds).split(',').map((id) => Number(id.trim())).filter(Boolean);
      }
    })();

    if (!activityId && parsedActivityIds.length > 0) {
      activityId = String(parsedActivityIds[0]);
    }

    const parseStringArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [String(value)];
      } catch {
        return String(value).split(',').map((v) => v.trim()).filter(Boolean);
      }
    };
    const parsedTags = parseStringArray(tags);
    const parsedAllowedRoles = parseStringArray(allowedRoles);

    if (!req.file) {
      return res.status(400).json({ message: 'File is required (multipart/form-data, field name "file")' });
    }

    // Determine path segments: block/project/activity
    let blockName = 'general';
    let projectName = projectId ? null : 'general';
    let activityName = activityId ? null : 'general';

    if (activityId) {
      const activity = await Activity.findByPk(activityId);
      if (activity) {
        activityName = activity.name || `activity-${activity.id}`;
        if (activity.projectId) projectName = null; // will fetch below
        if (!projectId) projectId = activity.projectId;
      }
    }

    let project = null;
    if (projectId) {
      project = await Project.findByPk(projectId);
      if (project) {
        projectName = project.name || `project-${project.id}`;
        if (project.blockId) {
          const block = await Block.findByPk(project.blockId);
          if (block) blockName = block.name || `block-${block.id}`;
        }
      }
    }

    // Fallback values
    const sanitizedBlock = sanitizeSegment(blockName);
    const sanitizedProject = sanitizeSegment(projectName || 'general');
    const sanitizedActivity = sanitizeSegment(activityName || 'general');
    const sanitizedLicence = licenceId ? sanitizeSegment(`licence-${licenceId}`) : 'general';

    const timestamp = Date.now();
    const originalName = req.file.originalname || 'upload.bin';
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
    const s3Key = licenceId 
      ? `licences/${sanitizedLicence}/${timestamp}-${sanitizedFilename}`
      : `${sanitizedBlock}/${sanitizedProject}/${sanitizedActivity}/${timestamp}-${sanitizedFilename}`;

    // Upload to S3
    const params = {
      Bucket: process.env.AWS_STORAGE_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    await s3.upload(params).promise();

    const newDocument = await Document.create({
      title: title || originalName,
      content: req.body.content || '',
      author: author || 'system',
      ownerId: req.user?.id || null,
      projectId: projectId || null,
      activityId: activityId || parsedActivityIds[0] || null,
      activityIds: parsedActivityIds.length > 0 ? parsedActivityIds : null,
      licenceId: licenceId || null,
      taskId: taskId || null,
      blockId: blockId || null,
      documentType: documentType || 'Report',
      category: category || 'Other',
      tags: parsedTags,
      awaitingResponseFrom: awaitingResponseFrom || null,
      responseDueDate: responseDueDate || null,
      confidentialityLevel: confidentialityLevel || 'Public',
      allowedRoles: parsedAllowedRoles,
      uploadDate: new Date(),
      status: status || 'Draft',
      filename: originalName,
      s3Key,
      mimeType: req.file.mimetype,
      size: req.file.size,
      versionNumber: 1
    });

    res.status(201).json(newDocument);
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(400).json({ message: err.message });
  }
});

// POST a new version for an existing document
router.post('/:id/versions', upload.single('file'), async (req, res) => {
  try {
    const { title, author, documentType, status } = req.body;
    const originalDocument = await Document.findByPk(req.params.id);
    if (!originalDocument) return res.status(404).json({ message: 'Document not found' });
    if (!req.file) {
      return res.status(400).json({ message: 'File is required (multipart/form-data, field name "file")' });
    }

    const rootDocumentId = originalDocument.rootDocumentId || originalDocument.id;
    const versions = await Document.findAll({ where: { rootDocumentId: rootDocumentId } });
    const nextVersion = versions.reduce((max, doc) => Math.max(max, doc.versionNumber || 1), originalDocument.versionNumber || 1) + 1;

    // Determine path segments: block/project/activity
    let blockName = 'general';
    let projectName = originalDocument.projectId ? null : 'general';
    let activityName = originalDocument.activityId ? null : 'general';

    if (originalDocument.activityId) {
      const activity = await Activity.findByPk(originalDocument.activityId);
      if (activity) {
        activityName = activity.name || `activity-${activity.id}`;
        if (activity.projectId) projectName = null; // will fetch below
      }
    }

    let project = null;
    if (originalDocument.projectId) {
      project = await Project.findByPk(originalDocument.projectId);
      if (project) {
        projectName = project.name || `project-${project.id}`;
        if (project.blockId) {
          const block = await Block.findByPk(project.blockId);
          if (block) blockName = block.name || `block-${block.id}`;
        }
      }
    }

    const sanitizedBlock = sanitizeSegment(blockName);
    const sanitizedProject = sanitizeSegment(projectName || 'general');
    const sanitizedActivity = sanitizeSegment(activityName || 'general');
    const sanitizedLicence = originalDocument.licenceId ? sanitizeSegment(`licence-${originalDocument.licenceId}`) : 'general';
    const timestamp = Date.now();
    const originalName = req.file.originalname || 'upload.bin';
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
    const s3Key = originalDocument.licenceId
      ? `licences/${sanitizedLicence}/${timestamp}-${sanitizedFilename}`
      : `${sanitizedBlock}/${sanitizedProject}/${sanitizedActivity}/${timestamp}-${sanitizedFilename}`;

    const params = {
      Bucket: process.env.AWS_STORAGE_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    await s3.upload(params).promise();

    const newVersion = await Document.create({
      title: title || originalDocument.title,
      content: originalDocument.content || '',
      author: author || originalDocument.author || 'system',
      ownerId: originalDocument.ownerId || req.user?.id || null,
      projectId: originalDocument.projectId || null,
      activityId: originalDocument.activityId || null,
      activityIds: Array.isArray(originalDocument.activityIds) ? originalDocument.activityIds : null,
      licenceId: originalDocument.licenceId || null,
      taskId: originalDocument.taskId || null,
      blockId: originalDocument.blockId || null,
      category: originalDocument.category || 'Other',
      tags: Array.isArray(originalDocument.tags) ? originalDocument.tags : [],
      awaitingResponseFrom: originalDocument.awaitingResponseFrom || null,
      responseDueDate: originalDocument.responseDueDate || null,
      confidentialityLevel: originalDocument.confidentialityLevel || 'Public',
      allowedRoles: Array.isArray(originalDocument.allowedRoles) ? originalDocument.allowedRoles : [],
      documentType: documentType || originalDocument.documentType || 'Report',
      uploadDate: new Date(),
      status: status || 'Draft',
      filename: originalName,
      s3Key,
      mimeType: req.file.mimetype,
      size: req.file.size,
      rootDocumentId,
      versionNumber: nextVersion
    });

    // Re-uploading creates a new version rather than overwriting the prior
    // one, and every earlier version in the chain becomes Superseded (§5.5
    // business rule / versioning semantics).
    await Document.update(
      { status: 'Superseded' },
      { where: { id: { [Op.in]: [...versions.map((v) => v.id), originalDocument.id].filter((docId) => docId !== newVersion.id) } } }
    );

    res.status(201).json(newVersion);
  } catch (err) {
    console.error('Error uploading document version:', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT update document
router.put('/:id', async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (!canViewDocument(req.user, document)) {
      return res.status(403).json({ message: 'This document is Confidential and restricted to named roles only' });
    }

    await document.update({
      title: req.body.title || document.title,
      content: req.body.content || document.content,
      author: req.body.author || document.author,
      projectId: req.body.projectId || document.projectId,
      activityId: req.body.activityId !== undefined ? req.body.activityId : document.activityId,
      activityIds: req.body.activityIds !== undefined ? req.body.activityIds : document.activityIds,
      licenceId: req.body.licenceId !== undefined ? req.body.licenceId : document.licenceId,
      taskId: req.body.taskId !== undefined ? req.body.taskId : document.taskId,
      blockId: req.body.blockId !== undefined ? req.body.blockId : document.blockId,
      documentType: req.body.documentType || document.documentType,
      category: req.body.category || document.category,
      tags: req.body.tags !== undefined ? req.body.tags : document.tags,
      awaitingResponseFrom: req.body.awaitingResponseFrom !== undefined ? req.body.awaitingResponseFrom : document.awaitingResponseFrom,
      responseDueDate: req.body.responseDueDate !== undefined ? req.body.responseDueDate : document.responseDueDate,
      confidentialityLevel: req.body.confidentialityLevel || document.confidentialityLevel,
      allowedRoles: req.body.allowedRoles !== undefined ? req.body.allowedRoles : document.allowedRoles,
      uploadDate: req.body.uploadDate || document.uploadDate,
      status: req.body.status || document.status
    });

    res.json(document);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE document (also removes from S3 if present). Only the document
// owner or Admin may delete (Requirements §5.5 business rule).
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const isOwner = document.ownerId && req.user?.id === document.ownerId;
    const isAdmin = req.user?.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the document owner or an Admin may delete this document' });
    }

    if (document.s3Key) {
      const params = {
        Bucket: process.env.AWS_STORAGE_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET,
        Key: document.s3Key
      };
      try {
        await s3.deleteObject(params).promise();
      } catch (s3err) {
        console.warn('Failed to delete file from S3:', s3err.message || s3err);
      }
    }

    await document.destroy();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;