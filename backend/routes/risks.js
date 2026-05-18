const express = require('express');
const router = express.Router();
const Risk = require('../models/Risk');

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
      mitigation: req.body.mitigation
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
      mitigation: req.body.mitigation || risk.mitigation
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
