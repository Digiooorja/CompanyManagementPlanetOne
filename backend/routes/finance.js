const express = require('express');
const router = express.Router();
const Finance = require('../models/Finance');

// GET all finance items
router.get('/', async (req, res) => {
  try {
    const items = await Finance.findAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET finance item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new finance item
router.post('/', async (req, res) => {
  try {
    const newItem = await Finance.create({
      item: req.body.item,
      amount: req.body.amount,
      category: req.body.category,
      type: req.body.type,
      date: req.body.date
    });
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update finance item
router.put('/:id', async (req, res) => {
  try {
    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });

    await item.update({
      item: req.body.item || item.item,
      amount: req.body.amount || item.amount,
      category: req.body.category || item.category,
      type: req.body.type || item.type,
      date: req.body.date || item.date
    });

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE finance item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });

    await item.destroy();
    res.json({ message: 'Finance item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;