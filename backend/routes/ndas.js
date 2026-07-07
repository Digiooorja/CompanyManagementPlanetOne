const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Nda = require('../models/Nda');
const DataRoomGrant = require('../models/DataRoomGrant');
const Document = require('../models/Document');

// GET all NDAs — filterable by blockId and status
router.get('/', async (req, res) => {
  try {
    const { blockId, status } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;

    const ndas = await Nda.findAll({ where, order: [['expiryDate', 'ASC']] });
    res.json(ndas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET NDA by ID
router.get('/:id', async (req, res) => {
  try {
    const nda = await Nda.findByPk(req.params.id);
    if (!nda) return res.status(404).json({ message: 'NDA not found' });
    res.json(nda);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new NDA
router.post('/', async (req, res) => {
  try {
    const nda = await Nda.create({
      counterparty: req.body.counterparty,
      ndaType: req.body.ndaType || 'Mutual',
      purpose: req.body.purpose || null,
      blockId: req.body.blockId || null,
      effectiveDate: req.body.effectiveDate || null,
      expiryDate: req.body.expiryDate || null,
      owner: req.body.owner || null,
      status: req.body.status || 'Draft',
      notes: req.body.notes || null
    });
    res.status(201).json(nda);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update NDA
router.put('/:id', async (req, res) => {
  try {
    const nda = await Nda.findByPk(req.params.id);
    if (!nda) return res.status(404).json({ message: 'NDA not found' });

    await nda.update({
      counterparty: req.body.counterparty !== undefined ? req.body.counterparty : nda.counterparty,
      ndaType: req.body.ndaType || nda.ndaType,
      purpose: req.body.purpose !== undefined ? req.body.purpose : nda.purpose,
      blockId: req.body.blockId !== undefined ? req.body.blockId : nda.blockId,
      effectiveDate: req.body.effectiveDate !== undefined ? req.body.effectiveDate : nda.effectiveDate,
      expiryDate: req.body.expiryDate !== undefined ? req.body.expiryDate : nda.expiryDate,
      owner: req.body.owner !== undefined ? req.body.owner : nda.owner,
      status: req.body.status || nda.status,
      notes: req.body.notes !== undefined ? req.body.notes : nda.notes
    });

    res.json(nda);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE NDA (cascades its data-room grants)
router.delete('/:id', async (req, res) => {
  try {
    const nda = await Nda.findByPk(req.params.id);
    if (!nda) return res.status(404).json({ message: 'NDA not found' });
    await DataRoomGrant.destroy({ where: { ndaId: nda.id } });
    await nda.destroy();
    res.json({ message: 'NDA deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Data-room grants (which documents this NDA's counterparty may access) ---

// GET grants for an NDA, with the linked document's title/status for display
router.get('/:id/grants', async (req, res) => {
  try {
    const nda = await Nda.findByPk(req.params.id);
    if (!nda) return res.status(404).json({ message: 'NDA not found' });

    const grants = await DataRoomGrant.findAll({
      where: { ndaId: nda.id },
      order: [['grantedAt', 'DESC']]
    });

    const documentIds = grants.map((g) => g.documentId);
    const documents = documentIds.length
      ? await Document.findAll({ where: { id: { [Op.in]: documentIds } }, attributes: ['id', 'title', 'status'] })
      : [];
    const documentMap = new Map(documents.map((d) => [d.id, d]));

    const enriched = grants.map((g) => ({
      ...g.toJSON(),
      document: documentMap.get(g.documentId) || null
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST grant access to a document under this NDA
router.post('/:id/grants', async (req, res) => {
  try {
    const nda = await Nda.findByPk(req.params.id);
    if (!nda) return res.status(404).json({ message: 'NDA not found' });
    if (!req.body.documentId) return res.status(400).json({ message: 'documentId is required' });

    const grant = await DataRoomGrant.create({
      ndaId: nda.id,
      documentId: req.body.documentId,
      accessLevel: req.body.accessLevel || 'View'
    });
    res.status(201).json(grant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT revoke a grant (soft — sets revokedAt rather than deleting, keeping access history auditable)
router.put('/:id/grants/:grantId/revoke', async (req, res) => {
  try {
    const grant = await DataRoomGrant.findOne({ where: { id: req.params.grantId, ndaId: req.params.id } });
    if (!grant) return res.status(404).json({ message: 'Data-room grant not found' });

    await grant.update({ revokedAt: new Date() });
    res.json(grant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
