const express = require('express');
const router = express.Router();
const Risk = require('../models/Risk');
const RiskMatrixSetting = require('../models/RiskMatrixSetting');
const { getRiskMatrixConfig, setRiskMatrixConfig } = require('../config/riskMatrix');

// GET the current Risk scoring matrix config (§5.15 "configurable matrix").
// Registered before `/:id` so it isn't swallowed by that param route.
router.get('/matrix-config', async (req, res) => {
  try {
    res.json(getRiskMatrixConfig());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update the Risk scoring matrix config — gated by the same
// `risks.manage` RBAC permission as the rest of this module (see
// `permissionProtectedRoutes` in server.js), no separate Admin check needed.
router.put('/matrix-config', async (req, res) => {
  try {
    const fields = ['lowWeight', 'mediumWeight', 'highWeight', 'mediumThreshold', 'highThreshold'];
    const updates = {};
    for (const field of fields) {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
        const value = Number(req.body[field]);
        if (Number.isNaN(value) || value <= 0) {
          return res.status(400).json({ message: `${field} must be a positive number` });
        }
        updates[field] = value;
      }
    }

    const [settings] = await RiskMatrixSetting.findOrCreate({ where: { id: 1 }, defaults: updates });
    await settings.update(updates);

    const refreshed = setRiskMatrixConfig(settings.toJSON());
    res.json(refreshed);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET all risks
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = {};
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    const risks = await Risk.findAll({ where });
    res.json(risks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET risk by ID
router.get('/:id', async (req, res) => {
  try {
    const risk = await Risk.findByPk(req.params.id);
    if (!risk) return res.status(404).json({ message: 'Risk not found' });
    res.json(risk);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new risk
router.post('/', async (req, res) => {
  try {
    const newRisk = await Risk.create({
      projectId: req.body.projectId,
      title: req.body.title,
      description: req.body.description,
      severity: req.body.severity,
      probability: req.body.probability,
      status: req.body.status,
      owner: req.body.owner,
      mitigation: req.body.mitigation,
      reviewDate: req.body.reviewDate || null
    });
    res.status(201).json(newRisk);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update risk
router.put('/:id', async (req, res) => {
  try {
    const risk = await Risk.findByPk(req.params.id);
    if (!risk) return res.status(404).json({ message: 'Risk not found' });

    await risk.update({
      projectId: req.body.projectId || risk.projectId,
      title: req.body.title || risk.title,
      description: req.body.description || risk.description,
      severity: req.body.severity || risk.severity,
      probability: req.body.probability || risk.probability,
      status: req.body.status || risk.status,
      owner: req.body.owner || risk.owner,
      mitigation: req.body.mitigation || risk.mitigation,
      reviewDate: req.body.reviewDate !== undefined ? (req.body.reviewDate || null) : risk.reviewDate
    });
    
    res.json(risk);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE risk
router.delete('/:id', async (req, res) => {
  try {
    const risk = await Risk.findByPk(req.params.id);
    if (!risk) return res.status(404).json({ message: 'Risk not found' });

    await risk.destroy();
    res.json({ message: 'Risk deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
