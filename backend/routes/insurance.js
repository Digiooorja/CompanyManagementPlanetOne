const express = require('express');
const router = express.Router();
const InsurancePolicy = require('../models/InsurancePolicy');

// GET all insurance policies — filterable by blockId, status and policyType
router.get('/', async (req, res) => {
  try {
    const { blockId, status, policyType } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;
    if (policyType) where.policyType = policyType;

    const policies = await InsurancePolicy.findAll({ where, order: [['expiryDate', 'ASC']] });
    res.json(policies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET insurance policy by ID
router.get('/:id', async (req, res) => {
  try {
    const policy = await InsurancePolicy.findByPk(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Insurance policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new insurance policy
router.post('/', async (req, res) => {
  try {
    const policy = await InsurancePolicy.create({
      policyNumber: req.body.policyNumber,
      insurer: req.body.insurer,
      broker: req.body.broker,
      policyType: req.body.policyType || 'Other',
      blockId: req.body.blockId || null,
      coverageAmount: req.body.coverageAmount || 0,
      currency: req.body.currency || 'USD',
      premium: req.body.premium || 0,
      effectiveDate: req.body.effectiveDate || null,
      expiryDate: req.body.expiryDate || null,
      renewalNoticePeriodDays: req.body.renewalNoticePeriodDays || null,
      owner: req.body.owner || null,
      status: req.body.status || 'Active',
      notes: req.body.notes || null
    });
    res.status(201).json(policy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update insurance policy
router.put('/:id', async (req, res) => {
  try {
    const policy = await InsurancePolicy.findByPk(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Insurance policy not found' });

    await policy.update({
      policyNumber: req.body.policyNumber !== undefined ? req.body.policyNumber : policy.policyNumber,
      insurer: req.body.insurer !== undefined ? req.body.insurer : policy.insurer,
      broker: req.body.broker !== undefined ? req.body.broker : policy.broker,
      policyType: req.body.policyType || policy.policyType,
      blockId: req.body.blockId !== undefined ? req.body.blockId : policy.blockId,
      coverageAmount: req.body.coverageAmount !== undefined ? req.body.coverageAmount : policy.coverageAmount,
      currency: req.body.currency || policy.currency,
      premium: req.body.premium !== undefined ? req.body.premium : policy.premium,
      effectiveDate: req.body.effectiveDate !== undefined ? req.body.effectiveDate : policy.effectiveDate,
      expiryDate: req.body.expiryDate !== undefined ? req.body.expiryDate : policy.expiryDate,
      renewalNoticePeriodDays: req.body.renewalNoticePeriodDays !== undefined ? req.body.renewalNoticePeriodDays : policy.renewalNoticePeriodDays,
      owner: req.body.owner !== undefined ? req.body.owner : policy.owner,
      status: req.body.status || policy.status,
      notes: req.body.notes !== undefined ? req.body.notes : policy.notes
    });

    res.json(policy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE insurance policy
router.delete('/:id', async (req, res) => {
  try {
    const policy = await InsurancePolicy.findByPk(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Insurance policy not found' });
    await policy.destroy();
    res.json({ message: 'Insurance policy deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
