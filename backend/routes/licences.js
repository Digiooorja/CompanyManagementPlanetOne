const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Licence = require('../models/Licence');
const Block = require('../models/Block');
const { authMiddleware, managerMiddleware, adminMiddleware } = require('../middleware/auth');

// Helper: enrich licence records with block names resolved from blockIds array
async function enrichWithBlockNames(licences) {
  const allBlocks = await Block.findAll({ attributes: ['id', 'name'] });
  const blockMap = allBlocks.reduce((map, b) => {
    map[b.id] = b.name;
    return map;
  }, {});

  return licences.map((lic) => {
    const licData = typeof lic.toJSON === 'function' ? lic.toJSON() : lic;
    const ids = Array.isArray(licData.blockIds) ? licData.blockIds : [];
    return {
      ...licData,
      blockNames: ids.map((id) => blockMap[id] || `Block #${id}`).filter(Boolean)
    };
  });
}

// GET all licences — enriched with resolved block names
router.get('/', async (req, res) => {
  try {
    const licences = await Licence.findAll({ order: [['expiryDate', 'ASC']] });
    const enriched = await enrichWithBlockNames(licences);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single licence by ID
router.get('/:id', async (req, res) => {
  try {
    const licence = await Licence.findByPk(req.params.id);
    if (!licence) return res.status(404).json({ message: 'Licence not found' });
    const [enriched] = await enrichWithBlockNames([licence]);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new licence — Manager or Admin only
router.post('/', authMiddleware, managerMiddleware, async (req, res) => {
  try {
    const licence = await Licence.create({
      licenceNumber: req.body.licenceNumber,
      licenceType: req.body.licenceType || 'Exploration',
      blockIds: Array.isArray(req.body.blockIds) ? req.body.blockIds : [],
      issuedBy: req.body.issuedBy || null,
      startDate: req.body.startDate || null,
      expiryDate: req.body.expiryDate || null,
      status: req.body.status || 'Active',
      notes: req.body.notes || null
    });
    const [enriched] = await enrichWithBlockNames([licence]);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update licence — Manager or Admin only
router.put('/:id', authMiddleware, managerMiddleware, async (req, res) => {
  try {
    const licence = await Licence.findByPk(req.params.id);
    if (!licence) return res.status(404).json({ message: 'Licence not found' });

    await licence.update({
      licenceNumber: req.body.licenceNumber !== undefined ? req.body.licenceNumber : licence.licenceNumber,
      licenceType: req.body.licenceType || licence.licenceType,
      blockIds: Array.isArray(req.body.blockIds) ? req.body.blockIds : licence.blockIds,
      issuedBy: req.body.issuedBy !== undefined ? req.body.issuedBy : licence.issuedBy,
      startDate: req.body.startDate !== undefined ? req.body.startDate : licence.startDate,
      expiryDate: req.body.expiryDate !== undefined ? req.body.expiryDate : licence.expiryDate,
      status: req.body.status || licence.status,
      notes: req.body.notes !== undefined ? req.body.notes : licence.notes
    });

    const [enriched] = await enrichWithBlockNames([licence]);
    res.json(enriched);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE licence — Admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const licence = await Licence.findByPk(req.params.id);
    if (!licence) return res.status(404).json({ message: 'Licence not found' });
    await licence.destroy();
    res.json({ message: 'Licence deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
