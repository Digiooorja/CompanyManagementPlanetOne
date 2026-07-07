const express = require('express');
const router = express.Router();
const LocalContentRecord = require('../models/LocalContentRecord');

// GET all local-content records — filterable by blockId, period and metric
router.get('/', async (req, res) => {
  try {
    const { blockId, period, metric } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (period) where.period = period;
    if (metric) where.metric = metric;

    const records = await LocalContentRecord.findAll({ where, order: [['period', 'ASC'], ['metric', 'ASC']] });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /summary - per-period roll-up (totals + average shortfall), aggregated
// directly from the same rows returned by GET / (roll-up always equals the
// sum of the underlying records by construction, same guarantee as
// budgetLines/summary and vendor-payments/aging-summary).
router.get('/summary', async (req, res) => {
  try {
    const records = await LocalContentRecord.findAll();

    const groups = new Map();
    for (const record of records) {
      const key = record.period;
      if (!groups.has(key)) {
        groups.set(key, {
          period: record.period,
          recordCount: 0,
          committedValue: 0,
          actualValue: 0,
          totalShortfallPercent: 0,
          shortfallCount: 0
        });
      }
      const g = groups.get(key);
      g.recordCount += 1;
      g.committedValue += Number(record.committedValue || 0);
      g.actualValue += Number(record.actualValue || 0);
      g.totalShortfallPercent += record.shortfallPercent;
      if (record.shortfallPercent > 0) g.shortfallCount += 1;
    }

    const summary = Array.from(groups.values()).map((g) => ({
      ...g,
      avgShortfallPercent: g.recordCount > 0 ? Number((g.totalShortfallPercent / g.recordCount).toFixed(2)) : 0
    }));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET local-content record by ID
router.get('/:id', async (req, res) => {
  try {
    const record = await LocalContentRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Local content record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new local-content record
router.post('/', async (req, res) => {
  try {
    const record = await LocalContentRecord.create({
      blockId: req.body.blockId || null,
      period: req.body.period,
      metric: req.body.metric || 'LocalSpend',
      committedPercent: req.body.committedPercent || 0,
      actualPercent: req.body.actualPercent || 0,
      committedValue: req.body.committedValue || 0,
      actualValue: req.body.actualValue || 0,
      currency: req.body.currency || 'GHS',
      narrative: req.body.narrative || null,
      reportingStatus: req.body.reportingStatus || 'Draft',
      regulator: req.body.regulator || 'Petroleum Commission'
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update local-content record
router.put('/:id', async (req, res) => {
  try {
    const record = await LocalContentRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Local content record not found' });

    await record.update({
      blockId: req.body.blockId !== undefined ? req.body.blockId : record.blockId,
      period: req.body.period !== undefined ? req.body.period : record.period,
      metric: req.body.metric || record.metric,
      committedPercent: req.body.committedPercent !== undefined ? req.body.committedPercent : record.committedPercent,
      actualPercent: req.body.actualPercent !== undefined ? req.body.actualPercent : record.actualPercent,
      committedValue: req.body.committedValue !== undefined ? req.body.committedValue : record.committedValue,
      actualValue: req.body.actualValue !== undefined ? req.body.actualValue : record.actualValue,
      currency: req.body.currency || record.currency,
      narrative: req.body.narrative !== undefined ? req.body.narrative : record.narrative,
      reportingStatus: req.body.reportingStatus || record.reportingStatus,
      regulator: req.body.regulator !== undefined ? req.body.regulator : record.regulator
    });

    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE local-content record
router.delete('/:id', async (req, res) => {
  try {
    const record = await LocalContentRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Local content record not found' });
    await record.destroy();
    res.json({ message: 'Local content record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
