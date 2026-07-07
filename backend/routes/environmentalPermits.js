const express = require('express');
const router = express.Router();
const EnvironmentalPermit = require('../models/EnvironmentalPermit');

// GET all environmental permits — filterable by blockId, status and permitType
router.get('/', async (req, res) => {
  try {
    const { blockId, status, permitType } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;
    if (permitType) where.permitType = permitType;

    const permits = await EnvironmentalPermit.findAll({ where, order: [['expiryDate', 'ASC']] });
    res.json(permits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET environmental permit by ID
router.get('/:id', async (req, res) => {
  try {
    const permit = await EnvironmentalPermit.findByPk(req.params.id);
    if (!permit) return res.status(404).json({ message: 'Environmental permit not found' });
    res.json(permit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new environmental permit
router.post('/', async (req, res) => {
  try {
    const permit = await EnvironmentalPermit.create({
      permitNumber: req.body.permitNumber,
      permitType: req.body.permitType || 'EPAPermit',
      regulator: req.body.regulator || 'EPA Ghana',
      blockId: req.body.blockId || null,
      issueDate: req.body.issueDate || null,
      expiryDate: req.body.expiryDate || null,
      conditions: req.body.conditions || null,
      owner: req.body.owner || null,
      status: req.body.status || 'Active',
      notes: req.body.notes || null
    });
    res.status(201).json(permit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update environmental permit
router.put('/:id', async (req, res) => {
  try {
    const permit = await EnvironmentalPermit.findByPk(req.params.id);
    if (!permit) return res.status(404).json({ message: 'Environmental permit not found' });

    await permit.update({
      permitNumber: req.body.permitNumber !== undefined ? req.body.permitNumber : permit.permitNumber,
      permitType: req.body.permitType || permit.permitType,
      regulator: req.body.regulator !== undefined ? req.body.regulator : permit.regulator,
      blockId: req.body.blockId !== undefined ? req.body.blockId : permit.blockId,
      issueDate: req.body.issueDate !== undefined ? req.body.issueDate : permit.issueDate,
      expiryDate: req.body.expiryDate !== undefined ? req.body.expiryDate : permit.expiryDate,
      conditions: req.body.conditions !== undefined ? req.body.conditions : permit.conditions,
      owner: req.body.owner !== undefined ? req.body.owner : permit.owner,
      status: req.body.status || permit.status,
      notes: req.body.notes !== undefined ? req.body.notes : permit.notes
    });

    res.json(permit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE environmental permit
router.delete('/:id', async (req, res) => {
  try {
    const permit = await EnvironmentalPermit.findByPk(req.params.id);
    if (!permit) return res.status(404).json({ message: 'Environmental permit not found' });
    await permit.destroy();
    res.json({ message: 'Environmental permit deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
