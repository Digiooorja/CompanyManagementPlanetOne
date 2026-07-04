const express = require('express');
const router = express.Router();
const NotificationRule = require('../models/NotificationRule');

// Admin-only CRUD for the rules that drive the Notification & Alert Engine
// (Requirements §10.4). Mounted behind authMiddleware + adminMiddleware in
// server.js, so Admin can retune lead times/escalation/channels per module
// without any code change.

// GET all rules
router.get('/', async (req, res) => {
  try {
    const { module } = req.query;
    const where = {};
    if (module) where.module = module;
    const rules = await NotificationRule.findAll({ where, order: [['module', 'ASC'], ['name', 'ASC']] });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET rule by ID
router.get('/:id', async (req, res) => {
  try {
    const rule = await NotificationRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Notification rule not found' });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new rule
router.post('/', async (req, res) => {
  try {
    const rule = await NotificationRule.create({
      name: req.body.name,
      module: req.body.module,
      triggerType: req.body.triggerType,
      dateField: req.body.dateField,
      leadTimeDays: req.body.leadTimeDays,
      thresholdField: req.body.thresholdField,
      thresholdValues: req.body.thresholdValues,
      statusField: req.body.statusField,
      statusValue: req.body.statusValue,
      recurrenceIntervalHours: req.body.recurrenceIntervalHours,
      escalationGraceHours: req.body.escalationGraceHours,
      priority: req.body.priority,
      channels: req.body.channels,
      messageTemplate: req.body.messageTemplate,
      active: req.body.active !== undefined ? req.body.active : true
    });
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update rule
router.put('/:id', async (req, res) => {
  try {
    const rule = await NotificationRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Notification rule not found' });

    const fields = [
      'name', 'module', 'triggerType', 'dateField', 'leadTimeDays', 'thresholdField',
      'thresholdValues', 'statusField', 'statusValue', 'recurrenceIntervalHours',
      'escalationGraceHours', 'priority', 'channels', 'messageTemplate', 'active'
    ];
    const updates = {};
    for (const field of fields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await rule.update(updates);
    res.json(rule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE rule
router.delete('/:id', async (req, res) => {
  try {
    const rule = await NotificationRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Notification rule not found' });

    await rule.destroy();
    res.json({ message: 'Notification rule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
