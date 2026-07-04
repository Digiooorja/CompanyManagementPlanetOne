const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Contract = require('../models/Contract');

// GET all contracts — filterable by blockId and status
router.get('/', async (req, res) => {
  try {
    const { blockId, status } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;

    const contracts = await Contract.findAll({ where, order: [['expiryDate', 'ASC']] });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET contract by ID
router.get('/:id', async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new contract
router.post('/', async (req, res) => {
  try {
    const contract = await Contract.create({
      title: req.body.title,
      counterparty: req.body.counterparty,
      contractType: req.body.contractType || 'Service',
      blockId: req.body.blockId || null,
      effectiveDate: req.body.effectiveDate || null,
      expiryDate: req.body.expiryDate || null,
      value: req.body.value || 0,
      renewalNoticePeriodDays: req.body.renewalNoticePeriodDays || null,
      autoRenew: !!req.body.autoRenew,
      owner: req.body.owner || null,
      status: req.body.status || 'Draft',
      notes: req.body.notes || null
    });
    res.status(201).json(contract);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update contract
router.put('/:id', async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    await contract.update({
      title: req.body.title !== undefined ? req.body.title : contract.title,
      counterparty: req.body.counterparty !== undefined ? req.body.counterparty : contract.counterparty,
      contractType: req.body.contractType || contract.contractType,
      blockId: req.body.blockId !== undefined ? req.body.blockId : contract.blockId,
      effectiveDate: req.body.effectiveDate !== undefined ? req.body.effectiveDate : contract.effectiveDate,
      expiryDate: req.body.expiryDate !== undefined ? req.body.expiryDate : contract.expiryDate,
      value: req.body.value !== undefined ? req.body.value : contract.value,
      renewalNoticePeriodDays: req.body.renewalNoticePeriodDays !== undefined ? req.body.renewalNoticePeriodDays : contract.renewalNoticePeriodDays,
      autoRenew: req.body.autoRenew !== undefined ? !!req.body.autoRenew : contract.autoRenew,
      owner: req.body.owner !== undefined ? req.body.owner : contract.owner,
      status: req.body.status || contract.status,
      notes: req.body.notes !== undefined ? req.body.notes : contract.notes
    });

    res.json(contract);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE contract
router.delete('/:id', async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    await contract.destroy();
    res.json({ message: 'Contract deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
