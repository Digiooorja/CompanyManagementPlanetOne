const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Decision = require('../models/Decision');
const Task = require('../models/Task');

// GET all decisions — searchable by keyword, date range and decision-maker
router.get('/', async (req, res) => {
  try {
    const { search, decisionMaker, dateFrom, dateTo, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (decisionMaker) where.decisionMakers = { [Op.like]: `%${decisionMaker}%` };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date[Op.gte] = new Date(dateFrom);
      if (dateTo) where.date[Op.lte] = new Date(dateTo);
    }
    if (search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { meetingContext: { [Op.like]: `%${search}%` } },
        { rationale: { [Op.like]: `%${search}%` } }
      ];
    }

    const decisions = await Decision.findAll({ where, order: [['date', 'DESC']] });
    res.json(decisions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET decision by ID — includes its follow-up action items (Tasks)
router.get('/:id', async (req, res) => {
  try {
    const decision = await Decision.findByPk(req.params.id);
    if (!decision) return res.status(404).json({ message: 'Decision not found' });

    const actionItems = await Task.findAll({
      where: { relatedType: 'Decision', relatedId: decision.id },
      order: [['createdAt', 'ASC']]
    });

    res.json({ ...decision.toJSON(), actionItems });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new decision — optionally creates follow-up action items as Tasks
router.post('/', async (req, res) => {
  try {
    const decision = await Decision.create({
      date: req.body.date || new Date(),
      meetingContext: req.body.meetingContext || null,
      description: req.body.description,
      decisionMakers: req.body.decisionMakers || null,
      rationale: req.body.rationale || null,
      linkedRiskId: req.body.linkedRiskId || null,
      linkedActivityId: req.body.linkedActivityId || null,
      linkedTaskId: req.body.linkedTaskId || null,
      status: req.body.status || 'Open'
    });

    if (Array.isArray(req.body.actionItems)) {
      for (const item of req.body.actionItems) {
        if (!item?.title) continue;
        await Task.create({
          title: item.title,
          description: item.description || null,
          dueDate: item.dueDate || null,
          assignedToId: item.assignedToId || null,
          relatedType: 'Decision',
          relatedId: decision.id
        });
      }
    }

    res.status(201).json(decision);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update decision
router.put('/:id', async (req, res) => {
  try {
    const decision = await Decision.findByPk(req.params.id);
    if (!decision) return res.status(404).json({ message: 'Decision not found' });

    await decision.update({
      date: req.body.date !== undefined ? req.body.date : decision.date,
      meetingContext: req.body.meetingContext !== undefined ? req.body.meetingContext : decision.meetingContext,
      description: req.body.description !== undefined ? req.body.description : decision.description,
      decisionMakers: req.body.decisionMakers !== undefined ? req.body.decisionMakers : decision.decisionMakers,
      rationale: req.body.rationale !== undefined ? req.body.rationale : decision.rationale,
      linkedRiskId: req.body.linkedRiskId !== undefined ? req.body.linkedRiskId : decision.linkedRiskId,
      linkedActivityId: req.body.linkedActivityId !== undefined ? req.body.linkedActivityId : decision.linkedActivityId,
      linkedTaskId: req.body.linkedTaskId !== undefined ? req.body.linkedTaskId : decision.linkedTaskId,
      status: req.body.status || decision.status
    });

    res.json(decision);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE decision
router.delete('/:id', async (req, res) => {
  try {
    const decision = await Decision.findByPk(req.params.id);
    if (!decision) return res.status(404).json({ message: 'Decision not found' });
    await decision.destroy();
    res.json({ message: 'Decision deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
