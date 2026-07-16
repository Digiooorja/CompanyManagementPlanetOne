const express = require('express');
const router = express.Router();
const NotificationRule = require('../models/NotificationRule');
const Department = require('../models/Department');

// Admin-only CRUD for the rules that drive the Notification & Alert Engine
// (Requirements §10.4). Mounted behind authMiddleware + adminMiddleware in
// server.js, so Admin can retune lead times/escalation/channels per module
// without any code change.

async function enrichWithDepartmentName(rules) {
  const departments = await Department.findAll({ attributes: ['id', 'name'] });
  const departmentMap = departments.reduce((map, d) => {
    map[d.id] = d.name;
    return map;
  }, {});
  return rules.map((rule) => {
    const data = typeof rule.toJSON === 'function' ? rule.toJSON() : rule;
    const ids = Array.isArray(data.departmentIds) ? data.departmentIds : [];
    return { ...data, departmentNames: ids.map((id) => departmentMap[id] || `Department #${id}`) };
  });
}

// GET all rules
router.get('/', async (req, res) => {
  try {
    const { module } = req.query;
    const where = {};
    if (module) where.module = module;
    const rules = await NotificationRule.findAll({ where, order: [['module', 'ASC'], ['name', 'ASC']] });
    res.json(await enrichWithDepartmentName(rules));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET rule by ID
router.get('/:id', async (req, res) => {
  try {
    const rule = await NotificationRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Notification rule not found' });
    const [enriched] = await enrichWithDepartmentName([rule]);
    res.json(enriched);
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
      active: req.body.active !== undefined ? req.body.active : true,
      departmentIds: Array.isArray(req.body.departmentIds) ? req.body.departmentIds : []
    });
    const [enriched] = await enrichWithDepartmentName([rule]);
    res.status(201).json(enriched);
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
      'escalationGraceHours', 'priority', 'channels', 'messageTemplate', 'active', 'departmentIds'
    ];
    const updates = {};
    for (const field of fields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await rule.update(updates);
    const [enriched] = await enrichWithDepartmentName([rule]);
    res.json(enriched);
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
