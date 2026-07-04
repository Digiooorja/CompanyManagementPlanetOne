const express = require('express');
const router = express.Router();
const OperationsUpdate = require('../models/OperationsUpdate');

// GET all operations updates — filterable by blockId; latest first so the
// most recent update can surface on a block's summary page (§5.12 acceptance criteria)
router.get('/', async (req, res) => {
  try {
    const { blockId, limit } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;

    const options = { where, order: [['date', 'DESC']] };
    if (limit) options.limit = Number(limit);

    const updates = await OperationsUpdate.findAll(options);
    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET operations update by ID
router.get('/:id', async (req, res) => {
  try {
    const update = await OperationsUpdate.findByPk(req.params.id);
    if (!update) return res.status(404).json({ message: 'Operations update not found' });
    res.json(update);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new operations update
router.post('/', async (req, res) => {
  try {
    const update = await OperationsUpdate.create({
      date: req.body.date || new Date(),
      blockId: req.body.blockId || null,
      wellName: req.body.wellName || null,
      author: req.body.author || null,
      summary: req.body.summary,
      keyIssues: req.body.keyIssues || null,
      nextSteps: req.body.nextSteps || null,
      attachmentDocumentIds: req.body.attachmentDocumentIds || []
    });
    res.status(201).json(update);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update operations update entry
router.put('/:id', async (req, res) => {
  try {
    const update = await OperationsUpdate.findByPk(req.params.id);
    if (!update) return res.status(404).json({ message: 'Operations update not found' });

    await update.update({
      date: req.body.date !== undefined ? req.body.date : update.date,
      blockId: req.body.blockId !== undefined ? req.body.blockId : update.blockId,
      wellName: req.body.wellName !== undefined ? req.body.wellName : update.wellName,
      author: req.body.author !== undefined ? req.body.author : update.author,
      summary: req.body.summary !== undefined ? req.body.summary : update.summary,
      keyIssues: req.body.keyIssues !== undefined ? req.body.keyIssues : update.keyIssues,
      nextSteps: req.body.nextSteps !== undefined ? req.body.nextSteps : update.nextSteps,
      attachmentDocumentIds: req.body.attachmentDocumentIds !== undefined ? req.body.attachmentDocumentIds : update.attachmentDocumentIds
    });

    res.json(update);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE operations update
router.delete('/:id', async (req, res) => {
  try {
    const update = await OperationsUpdate.findByPk(req.params.id);
    if (!update) return res.status(404).json({ message: 'Operations update not found' });
    await update.destroy();
    res.json({ message: 'Operations update deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
