const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Correspondence = require('../models/Correspondence');

// GET all correspondence — filterable, full-text search across subject/summary
router.get('/', async (req, res) => {
  try {
    const { blockId, direction, awaitingResponse, search } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (direction) where.direction = direction;
    if (awaitingResponse !== undefined) where.awaitingResponse = awaitingResponse === 'true';
    if (search) {
      where[Op.or] = [
        { subject: { [Op.like]: `%${search}%` } },
        { summary: { [Op.like]: `%${search}%` } },
        { referenceNo: { [Op.like]: `%${search}%` } }
      ];
    }

    const entries = await Correspondence.findAll({ where, order: [['date', 'DESC']] });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET correspondence by ID
router.get('/:id', async (req, res) => {
  try {
    const entry = await Correspondence.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Correspondence entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new correspondence entry
router.post('/', async (req, res) => {
  try {
    const entry = await Correspondence.create({
      direction: req.body.direction || 'Inbound',
      date: req.body.date || new Date(),
      fromParty: req.body.fromParty || null,
      toParty: req.body.toParty || null,
      regulator: req.body.regulator || null,
      subject: req.body.subject,
      referenceNo: req.body.referenceNo || null,
      summary: req.body.summary || null,
      blockId: req.body.blockId || null,
      awaitingResponse: !!req.body.awaitingResponse,
      responseDueDate: req.body.responseDueDate || null,
      documentId: req.body.documentId || null,
      status: req.body.status || 'Open'
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update correspondence entry
router.put('/:id', async (req, res) => {
  try {
    const entry = await Correspondence.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Correspondence entry not found' });

    await entry.update({
      direction: req.body.direction || entry.direction,
      date: req.body.date !== undefined ? req.body.date : entry.date,
      fromParty: req.body.fromParty !== undefined ? req.body.fromParty : entry.fromParty,
      toParty: req.body.toParty !== undefined ? req.body.toParty : entry.toParty,
      regulator: req.body.regulator !== undefined ? req.body.regulator : entry.regulator,
      subject: req.body.subject !== undefined ? req.body.subject : entry.subject,
      referenceNo: req.body.referenceNo !== undefined ? req.body.referenceNo : entry.referenceNo,
      summary: req.body.summary !== undefined ? req.body.summary : entry.summary,
      blockId: req.body.blockId !== undefined ? req.body.blockId : entry.blockId,
      awaitingResponse: req.body.awaitingResponse !== undefined ? !!req.body.awaitingResponse : entry.awaitingResponse,
      responseDueDate: req.body.responseDueDate !== undefined ? req.body.responseDueDate : entry.responseDueDate,
      documentId: req.body.documentId !== undefined ? req.body.documentId : entry.documentId,
      status: req.body.status || entry.status
    });

    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE correspondence entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await Correspondence.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Correspondence entry not found' });
    await entry.destroy();
    res.json({ message: 'Correspondence entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
