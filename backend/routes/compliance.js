const express = require('express');
const router = express.Router();
const ComplianceObligation = require('../models/ComplianceObligation');

function addInterval(date, frequency) {
  const next = new Date(date);
  switch (frequency) {
    case 'Monthly':
      next.setMonth(next.getMonth() + 1);
      return next;
    case 'Quarterly':
      next.setMonth(next.getMonth() + 3);
      return next;
    case 'Annual':
      next.setFullYear(next.getFullYear() + 1);
      return next;
    default:
      return null;
  }
}

// GET all compliance obligations — filterable by blockId and status
router.get('/', async (req, res) => {
  try {
    const { blockId, status } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;

    const obligations = await ComplianceObligation.findAll({ where, order: [['dueDate', 'ASC']] });
    res.json(obligations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET obligation by ID
router.get('/:id', async (req, res) => {
  try {
    const obligation = await ComplianceObligation.findByPk(req.params.id);
    if (!obligation) return res.status(404).json({ message: 'Compliance obligation not found' });
    res.json(obligation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new obligation
router.post('/', async (req, res) => {
  try {
    const obligation = await ComplianceObligation.create({
      description: req.body.description,
      regulatoryBody: req.body.regulatoryBody || null,
      category: req.body.category || 'Other',
      frequency: req.body.frequency || 'One-off',
      blockId: req.body.blockId || null,
      dueDate: req.body.dueDate || null,
      amountDue: req.body.amountDue || 0,
      amountPaid: req.body.amountPaid || 0,
      paymentDate: req.body.paymentDate || null,
      referenceNo: req.body.referenceNo || null,
      evidenceDocumentId: req.body.evidenceDocumentId || null,
      status: req.body.status || 'Pending',
      responsibleOfficer: req.body.responsibleOfficer || null
    });
    res.status(201).json(obligation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update obligation — enforces the §5.7 business rules:
//   - an overdue obligation cannot be closed without an evidence document
//   - a recurring obligation auto-regenerates its next occurrence on completion
router.put('/:id', async (req, res) => {
  try {
    const obligation = await ComplianceObligation.findByPk(req.params.id);
    if (!obligation) return res.status(404).json({ message: 'Compliance obligation not found' });

    const nextStatus = req.body.status || obligation.status;
    const isClosing = ['Paid', 'Closed'].includes(nextStatus) && !['Paid', 'Closed'].includes(obligation.status);
    const wasOverdue = obligation.dueDate && new Date(obligation.dueDate) < new Date() && obligation.status !== 'Closed';
    const evidenceDocumentId = req.body.evidenceDocumentId !== undefined ? req.body.evidenceDocumentId : obligation.evidenceDocumentId;

    if (isClosing && wasOverdue && !evidenceDocumentId) {
      return res.status(400).json({ message: 'An overdue obligation cannot be closed without an attached evidence document' });
    }

    await obligation.update({
      description: req.body.description !== undefined ? req.body.description : obligation.description,
      regulatoryBody: req.body.regulatoryBody !== undefined ? req.body.regulatoryBody : obligation.regulatoryBody,
      category: req.body.category || obligation.category,
      frequency: req.body.frequency || obligation.frequency,
      blockId: req.body.blockId !== undefined ? req.body.blockId : obligation.blockId,
      dueDate: req.body.dueDate !== undefined ? req.body.dueDate : obligation.dueDate,
      amountDue: req.body.amountDue !== undefined ? req.body.amountDue : obligation.amountDue,
      amountPaid: req.body.amountPaid !== undefined ? req.body.amountPaid : obligation.amountPaid,
      paymentDate: req.body.paymentDate !== undefined ? req.body.paymentDate : obligation.paymentDate,
      referenceNo: req.body.referenceNo !== undefined ? req.body.referenceNo : obligation.referenceNo,
      evidenceDocumentId,
      status: nextStatus,
      responsibleOfficer: req.body.responsibleOfficer !== undefined ? req.body.responsibleOfficer : obligation.responsibleOfficer
    });

    // Auto-regenerate the next occurrence once a recurring obligation is closed.
    if (isClosing && obligation.frequency !== 'One-off' && obligation.dueDate) {
      const nextDueDate = addInterval(obligation.dueDate, obligation.frequency);
      if (nextDueDate) {
        await ComplianceObligation.create({
          description: obligation.description,
          regulatoryBody: obligation.regulatoryBody,
          category: obligation.category,
          frequency: obligation.frequency,
          blockId: obligation.blockId,
          dueDate: nextDueDate,
          amountDue: obligation.amountDue,
          amountPaid: 0,
          paymentDate: null,
          referenceNo: null,
          evidenceDocumentId: null,
          status: 'Pending',
          responsibleOfficer: obligation.responsibleOfficer
        });
      }
    }

    res.json(obligation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE obligation
router.delete('/:id', async (req, res) => {
  try {
    const obligation = await ComplianceObligation.findByPk(req.params.id);
    if (!obligation) return res.status(404).json({ message: 'Compliance obligation not found' });
    await obligation.destroy();
    res.json({ message: 'Compliance obligation deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
