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

// GET all documents
router.get('/', async (req, res) => {
  try {
    const { projectId, activityId } = req.query;
    const where = {};

    if (projectId) {
      where.projectId = projectId;
    }
    if (activityId) {
      where.activityId = activityId;
    }

    const documents = await Document.findAll({ where });
    let documentData = documents.map((doc) => doc.toJSON());

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

    const documentData = document.toJSON();
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

// POST new document with file upload (field: file). Accepts activityId or projectId.
router.post('/', upload.single('file'), async (req, res) => {
  try {
    let { title, author, projectId, activityId, activityIds, documentType, status } = req.body;

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

    const timestamp = Date.now();
    const originalName = req.file.originalname || 'upload.bin';
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
    const s3Key = `${sanitizedBlock}/${sanitizedProject}/${sanitizedActivity}/${timestamp}-${sanitizedFilename}`;

    // Upload to S3
    const params = {
      Bucket: process.env.AWS_STORAGE_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    await s3.upload(params).promise();

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

    const newDocument = await Document.create({
      title: title || originalName,
      content: req.body.content || '',
      author: author || 'system',
      projectId: projectId || null,
      activityId: activityId || parsedActivityIds[0] || null,
      activityIds: parsedActivityIds.length > 0 ? parsedActivityIds : null,
      documentType: documentType || 'Report',
      uploadDate: new Date(),
      status: status || 'Review',
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
    const timestamp = Date.now();
    const originalName = req.file.originalname || 'upload.bin';
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
    const s3Key = `${sanitizedBlock}/${sanitizedProject}/${sanitizedActivity}/${timestamp}-${sanitizedFilename}`;

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
      projectId: originalDocument.projectId || null,
      activityId: originalDocument.activityId || null,
      activityIds: Array.isArray(originalDocument.activityIds) ? originalDocument.activityIds : null,
      documentType: documentType || originalDocument.documentType || 'Report',
      uploadDate: new Date(),
      status: status || originalDocument.status || 'Review',
      filename: originalName,
      s3Key,
      mimeType: req.file.mimetype,
      size: req.file.size,
      rootDocumentId,
      versionNumber: nextVersion
    });

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

    await document.update({
      title: req.body.title || document.title,
      content: req.body.content || document.content,
      author: req.body.author || document.author,
      projectId: req.body.projectId || document.projectId,
      activityId: req.body.activityId !== undefined ? req.body.activityId : document.activityId,
      activityIds: req.body.activityIds !== undefined ? req.body.activityIds : document.activityIds,
      documentType: req.body.documentType || document.documentType,
      uploadDate: req.body.uploadDate || document.uploadDate,
      status: req.body.status || document.status
    });

    res.json(document);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE document (also removes from S3 if present)
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

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