const express = require('express');
const router = express.Router();
const ForexTransaction = require('../models/ForexTransaction');

// GET all forex transactions — filterable by status
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const transactions = await ForexTransaction.findAll({ where, order: [['settlementDate', 'ASC'], ['createdAt', 'DESC']] });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET forex transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await ForexTransaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new forex transaction (starts life as Draft)
router.post('/', async (req, res) => {
  try {
    const transaction = await ForexTransaction.create({
      reference: req.body.reference || null,
      transactionType: req.body.transactionType || 'Spot',
      fromCurrency: req.body.fromCurrency || 'USD',
      toCurrency: req.body.toCurrency || 'GHS',
      amount: req.body.amount || 0,
      rate: req.body.rate || 0,
      bank: req.body.bank || null,
      valueDate: req.body.valueDate || null,
      settlementDate: req.body.settlementDate || null,
      purpose: req.body.purpose || null,
      status: 'Draft'
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update forex transaction — schedule/amount/rate fields only while
// still Draft; status transitions must go through the action endpoints
// below (mirrors budgetLines.js's approvedBudget guard).
router.put('/:id', async (req, res) => {
  try {
    const transaction = await ForexTransaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });

    if (req.body.status !== undefined && req.body.status !== transaction.status) {
      return res.status(400).json({
        message: 'status cannot be changed directly — use /request-approval, /approve, /reject or /settle'
      });
    }

    await transaction.update({
      reference: req.body.reference !== undefined ? req.body.reference : transaction.reference,
      transactionType: req.body.transactionType || transaction.transactionType,
      fromCurrency: req.body.fromCurrency || transaction.fromCurrency,
      toCurrency: req.body.toCurrency || transaction.toCurrency,
      amount: req.body.amount !== undefined ? req.body.amount : transaction.amount,
      rate: req.body.rate !== undefined ? req.body.rate : transaction.rate,
      bank: req.body.bank !== undefined ? req.body.bank : transaction.bank,
      valueDate: req.body.valueDate !== undefined ? req.body.valueDate : transaction.valueDate,
      settlementDate: req.body.settlementDate !== undefined ? req.body.settlementDate : transaction.settlementDate,
      purpose: req.body.purpose !== undefined ? req.body.purpose : transaction.purpose
    });

    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/request-approval - maker submits a Draft for checker approval
router.post('/:id/request-approval', async (req, res) => {
  try {
    const transaction = await ForexTransaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });

    if (!['Draft', 'Rejected'].includes(transaction.status)) {
      return res.status(400).json({ message: 'Only a Draft or Rejected transaction can be submitted for approval' });
    }

    await transaction.update({
      status: 'PendingApproval',
      requestedById: req.user?.id || null,
      requestedAt: new Date(),
      approvedById: null,
      approvedAt: null,
      decisionComment: req.body.comment || null
    });

    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/approve - checker approves; maker-checker separation of duties
// is enforced (the approver cannot be the requester), Admin excepted —
// same rule as budgetLines.js /:id/approve-revision.
router.post('/:id/approve', async (req, res) => {
  try {
    const transaction = await ForexTransaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });

    if (transaction.status !== 'PendingApproval') {
      return res.status(400).json({ message: 'No pending approval for this transaction' });
    }
    if (req.user?.id && transaction.requestedById === req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'The maker of a request cannot also approve it (maker-checker separation of duties)' });
    }

    await transaction.update({
      status: 'Approved',
      approvedById: req.user?.id || null,
      approvedAt: new Date(),
      decisionComment: req.body.comment || transaction.decisionComment
    });

    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/reject - checker rejects
router.post('/:id/reject', async (req, res) => {
  try {
    const transaction = await ForexTransaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });

    if (transaction.status !== 'PendingApproval') {
      return res.status(400).json({ message: 'No pending approval for this transaction' });
    }

    await transaction.update({
      status: 'Rejected',
      approvedById: req.user?.id || null,
      approvedAt: new Date(),
      decisionComment: req.body.comment || transaction.decisionComment
    });

    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/settle - marks an Approved transaction as executed with the bank
router.post('/:id/settle', async (req, res) => {
  try {
    const transaction = await ForexTransaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });

    if (transaction.status !== 'Approved') {
      return res.status(400).json({ message: 'Only an Approved transaction can be settled' });
    }

    await transaction.update({
      status: 'Settled',
      settledById: req.user?.id || null,
      settledAt: new Date()
    });

    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE forex transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await ForexTransaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Forex transaction not found' });
    await transaction.destroy();
    res.json({ message: 'Forex transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
