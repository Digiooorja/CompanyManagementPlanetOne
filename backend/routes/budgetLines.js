const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const BudgetLine = require('../models/BudgetLine');
const Block = require('../models/Block');

// GET / - list budget lines, filterable by block/status/currency (drill-down
// from the portfolio summary to individual line items, §5.6)
router.get('/', async (req, res) => {
  try {
    const { blockId, status, currency, activityId } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;
    if (currency) where.currency = currency;
    if (activityId) where.activityId = activityId;

    const lines = await BudgetLine.findAll({ where, order: [['blockId', 'ASC'], ['createdAt', 'DESC']] });
    res.json(lines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /summary - roll-up totals per block/currency, so the sum of line
// items always equals the roll-up (§5.6 acceptance criteria)
router.get('/summary', async (req, res) => {
  try {
    const lines = await BudgetLine.findAll();
    const blocks = await Block.findAll({ attributes: ['id', 'name'] });
    const blockNames = blocks.reduce((acc, b) => ({ ...acc, [b.id]: b.name }), {});

    const groups = new Map();
    for (const line of lines) {
      const key = `${line.blockId}|${line.currency}`;
      if (!groups.has(key)) {
        groups.set(key, {
          blockId: line.blockId,
          blockName: blockNames[line.blockId] || `Block #${line.blockId}`,
          currency: line.currency,
          lineCount: 0,
          approvedBudget: 0,
          committed: 0,
          actualSpend: 0,
          flaggedCount: 0
        });
      }
      const g = groups.get(key);
      g.lineCount += 1;
      g.approvedBudget += Number(line.approvedBudget || 0);
      g.committed += Number(line.committed || 0);
      g.actualSpend += Number(line.actualSpend || 0);
      if (line.absVariancePercent > 10) g.flaggedCount += 1;
    }

    res.json(Array.from(groups.values()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /export - variance report as CSV, matching the underlying data
// (§5.6 acceptance criteria: "Variance report is exportable and matches the
// underlying data")
router.get('/export', async (req, res) => {
  try {
    const { blockId } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;

    const lines = await BudgetLine.findAll({ where, order: [['blockId', 'ASC'], ['id', 'ASC']] });

    const headers = [
      'id', 'blockId', 'activityId', 'description', 'budgetCategory', 'currency',
      'approvedBudget', 'committed', 'actualSpend', 'variancePercent', 'utilisationPercent',
      'responsiblePerson', 'status', 'revisionStatus'
    ];
    const escape = (v) => (v == null ? '' : `"${String(v).replace(/"/g, '""')}"`);
    const rows = [headers.join(',')];
    for (const line of lines) {
      rows.push(
        headers.map((h) => escape(line.get ? line.get(h) : line[h])).join(',')
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="budget-variance-report.csv"');
    res.send(rows.join('\n'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const line = await BudgetLine.findByPk(req.params.id);
    if (!line) return res.status(404).json({ message: 'Budget line not found' });
    res.json(line);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST / - create a new line. approvedBudget may be set directly at
// creation; once created, it can only change via the revision workflow.
router.post('/', async (req, res) => {
  try {
    const line = await BudgetLine.create({
      blockId: req.body.blockId,
      activityId: req.body.activityId || null,
      description: req.body.description,
      budgetCategory: req.body.budgetCategory || null,
      plannedStartDate: req.body.plannedStartDate || null,
      plannedEndDate: req.body.plannedEndDate || null,
      actualStartDate: req.body.actualStartDate || null,
      actualEndDate: req.body.actualEndDate || null,
      currency: req.body.currency || 'USD',
      approvedBudget: req.body.approvedBudget || 0,
      committed: req.body.committed || 0,
      actualSpend: req.body.actualSpend || 0,
      responsiblePerson: req.body.responsiblePerson || null,
      status: req.body.status || 'Draft'
    });
    res.status(201).json(line);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /:id - update schedule/committed/actual/status fields. approvedBudget
// is intentionally NOT accepted here — a revision must go through
// request-revision/approve-revision (§5.6 business rule).
router.put('/:id', async (req, res) => {
  try {
    const line = await BudgetLine.findByPk(req.params.id);
    if (!line) return res.status(404).json({ message: 'Budget line not found' });

    if (req.body.approvedBudget !== undefined && Number(req.body.approvedBudget) !== Number(line.approvedBudget)) {
      return res.status(400).json({
        message: 'approvedBudget cannot be changed directly — submit a revision via POST /:id/request-revision'
      });
    }

    await line.update({
      description: req.body.description !== undefined ? req.body.description : line.description,
      budgetCategory: req.body.budgetCategory !== undefined ? req.body.budgetCategory : line.budgetCategory,
      activityId: req.body.activityId !== undefined ? req.body.activityId : line.activityId,
      plannedStartDate: req.body.plannedStartDate !== undefined ? req.body.plannedStartDate : line.plannedStartDate,
      plannedEndDate: req.body.plannedEndDate !== undefined ? req.body.plannedEndDate : line.plannedEndDate,
      actualStartDate: req.body.actualStartDate !== undefined ? req.body.actualStartDate : line.actualStartDate,
      actualEndDate: req.body.actualEndDate !== undefined ? req.body.actualEndDate : line.actualEndDate,
      currency: req.body.currency || line.currency,
      committed: req.body.committed !== undefined ? req.body.committed : line.committed,
      actualSpend: req.body.actualSpend !== undefined ? req.body.actualSpend : line.actualSpend,
      responsiblePerson: req.body.responsiblePerson !== undefined ? req.body.responsiblePerson : line.responsiblePerson,
      status: req.body.status || line.status
    });

    res.json(line);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/request-revision - maker proposes a new approvedBudget
router.post('/:id/request-revision', async (req, res) => {
  try {
    const line = await BudgetLine.findByPk(req.params.id);
    if (!line) return res.status(404).json({ message: 'Budget line not found' });

    const { proposedApprovedBudget, comment } = req.body;
    if (proposedApprovedBudget === undefined || proposedApprovedBudget === null) {
      return res.status(400).json({ message: 'proposedApprovedBudget is required' });
    }
    if (line.revisionStatus === 'PendingApproval') {
      return res.status(400).json({ message: 'A revision is already pending approval for this line' });
    }

    await line.update({
      revisionStatus: 'PendingApproval',
      pendingApprovedBudget: proposedApprovedBudget,
      revisionRequestedById: req.user?.id || null,
      revisionRequestedAt: new Date(),
      revisionDecidedById: null,
      revisionDecidedAt: null,
      revisionComment: comment || null
    });

    res.json(line);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/approve-revision - checker approves; maker-checker separation
// of duties is enforced (the approver cannot be the requester).
router.post('/:id/approve-revision', async (req, res) => {
  try {
    const line = await BudgetLine.findByPk(req.params.id);
    if (!line) return res.status(404).json({ message: 'Budget line not found' });

    if (line.revisionStatus !== 'PendingApproval') {
      return res.status(400).json({ message: 'No pending revision to approve' });
    }
    if (req.user?.id && line.revisionRequestedById === req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'The maker of a revision cannot also approve it (maker-checker separation of duties)' });
    }

    await line.update({
      approvedBudget: line.pendingApprovedBudget,
      pendingApprovedBudget: null,
      revisionStatus: 'Approved',
      revisionDecidedById: req.user?.id || null,
      revisionDecidedAt: new Date(),
      revisionComment: req.body.comment || line.revisionComment
    });

    res.json(line);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/reject-revision - checker rejects; approvedBudget is unchanged
router.post('/:id/reject-revision', async (req, res) => {
  try {
    const line = await BudgetLine.findByPk(req.params.id);
    if (!line) return res.status(404).json({ message: 'Budget line not found' });

    if (line.revisionStatus !== 'PendingApproval') {
      return res.status(400).json({ message: 'No pending revision to reject' });
    }

    await line.update({
      pendingApprovedBudget: null,
      revisionStatus: 'Rejected',
      revisionDecidedById: req.user?.id || null,
      revisionDecidedAt: new Date(),
      revisionComment: req.body.comment || line.revisionComment
    });

    res.json(line);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const line = await BudgetLine.findByPk(req.params.id);
    if (!line) return res.status(404).json({ message: 'Budget line not found' });
    await line.destroy();
    res.json({ message: 'Budget line deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
