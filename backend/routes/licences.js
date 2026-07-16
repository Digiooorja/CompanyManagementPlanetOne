const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Licence = require('../models/Licence');
const Block = require('../models/Block');

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

// POST create new licence — gated by the `licences.manage` RBAC permission
// at the mount level in server.js (permissionProtectedRoutes)
router.post('/', async (req, res) => {
  try {
    const licence = await Licence.create({
      licenceNumber: req.body.licenceNumber,
      licenceType: req.body.licenceType || 'Exploration',
      blockIds: Array.isArray(req.body.blockIds) ? req.body.blockIds : [],
      issuedBy: req.body.issuedBy || null,
      startDate: req.body.startDate || null,
      expiryDate: req.body.expiryDate || null,
      status: req.body.status || 'Active',
      notes: req.body.notes || null,
      // Initial phase can be set directly on creation - it's establishing the
      // starting state, not a "transition" (§5.9). Changing it afterwards
      // requires POST /:id/transition-phase.
      phase: req.body.phase || null,
      phaseStartDate: req.body.phaseStartDate || null,
      phaseEndDate: req.body.phaseEndDate || null,
      minWorkObligation: req.body.minWorkObligation || null
    });
    const [enriched] = await enrichWithBlockNames([licence]);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update licence — gated by the `licences.manage` RBAC permission
// at the mount level in server.js (permissionProtectedRoutes)
router.put('/:id', async (req, res) => {
  try {
    const licence = await Licence.findByPk(req.params.id);
    if (!licence) return res.status(404).json({ message: 'Licence not found' });

    // Controlled phase transition (§5.9 business rule) - changing the phase
    // itself requires an audited sign-off via POST /:id/transition-phase, not
    // a plain field edit. Editing phaseStartDate/phaseEndDate/minWorkObligation
    // without also changing `phase` is still allowed here (e.g. correcting a
    // typo'd date), same as how AFE closure only blocks the status change
    // itself in routes/finance.js.
    if (req.body.phase !== undefined && req.body.phase !== licence.phase) {
      return res.status(400).json({
        message: 'Changing the licence phase requires a controlled transition — use POST /:id/transition-phase instead'
      });
    }

    await licence.update({
      licenceNumber: req.body.licenceNumber !== undefined ? req.body.licenceNumber : licence.licenceNumber,
      licenceType: req.body.licenceType || licence.licenceType,
      blockIds: Array.isArray(req.body.blockIds) ? req.body.blockIds : licence.blockIds,
      issuedBy: req.body.issuedBy !== undefined ? req.body.issuedBy : licence.issuedBy,
      startDate: req.body.startDate !== undefined ? req.body.startDate : licence.startDate,
      expiryDate: req.body.expiryDate !== undefined ? req.body.expiryDate : licence.expiryDate,
      status: req.body.status || licence.status,
      notes: req.body.notes !== undefined ? req.body.notes : licence.notes,
      phaseStartDate: req.body.phaseStartDate !== undefined ? req.body.phaseStartDate : licence.phaseStartDate,
      phaseEndDate: req.body.phaseEndDate !== undefined ? req.body.phaseEndDate : licence.phaseEndDate,
      minWorkObligation: req.body.minWorkObligation !== undefined ? req.body.minWorkObligation : licence.minWorkObligation
    });

    const [enriched] = await enrichWithBlockNames([licence]);
    res.json(enriched);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/transition-phase - controlled licence phase transition with
// mandatory, audited sign-off (§5.9 business rule / acceptance criteria).
// Gated by the same `licences.manage` RBAC permission as other mutations —
// there's no separate approver-hierarchy defined for licences in the
// requirements (unlike Finance's department-based approval), so "sign-off"
// here means a mandatory confirmation + recorded comment/user/timestamp,
// mirroring the shape of routes/finance.js's POST /:id/close.
router.post('/:id/transition-phase', async (req, res) => {
  try {
    const licence = await Licence.findByPk(req.params.id);
    if (!licence) return res.status(404).json({ message: 'Licence not found' });

    const { newPhase, phaseStartDate, phaseEndDate, minWorkObligation, comment, confirmed } = req.body;

    const VALID_PHASES = ['Exploration', 'Extension', 'Appraisal', 'Development', 'Production'];
    if (!newPhase || !VALID_PHASES.includes(newPhase)) {
      return res.status(400).json({ message: `newPhase is required and must be one of: ${VALID_PHASES.join(', ')}` });
    }
    if (!confirmed) {
      return res.status(400).json({ message: 'confirmed must be true to sign off on a phase transition' });
    }
    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ message: 'A sign-off comment is required to transition phase' });
    }

    await licence.update({
      phase: newPhase,
      phaseStartDate: phaseStartDate || new Date(),
      phaseEndDate: phaseEndDate || null,
      minWorkObligation: minWorkObligation !== undefined ? minWorkObligation : licence.minWorkObligation,
      phaseTransitionedById: req.user?.id || null,
      phaseTransitionedAt: new Date(),
      phaseTransitionComment: comment
    });

    const [enriched] = await enrichWithBlockNames([licence]);
    res.json(enriched);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE licence — gated by the `licences.manage` RBAC permission
// at the mount level in server.js (permissionProtectedRoutes)
router.delete('/:id', async (req, res) => {
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
