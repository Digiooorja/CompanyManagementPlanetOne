const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

// GET all documents
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = {};
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    const documents = await Document.findAll({ where });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET document by ID
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new document
router.post('/', async (req, res) => {
  try {
    const newDocument = await Document.create({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      projectId: req.body.projectId,
      documentType: req.body.documentType,
      uploadDate: req.body.uploadDate,
      status: req.body.status
    });
    res.status(201).json(newDocument);
  } catch (err) {
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
      documentType: req.body.documentType || document.documentType,
      uploadDate: req.body.uploadDate || document.uploadDate,
      status: req.body.status || document.status
    });

    res.json(document);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE document
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    await document.destroy();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;