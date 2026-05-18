const express = require('express');
const router = express.Router();
const Block = require('../models/Block');

// GET all blocks
router.get('/', async (req, res) => {
  try {
    const blocks = await Block.findAll();
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET block by ID
router.get('/:id', async (req, res) => {
  try {
    const block = await Block.findByPk(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });
    res.json(block);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new block
router.post('/', async (req, res) => {
  try {
    const block = await Block.create({
      name: req.body.name,
      description: req.body.description,
      status: req.body.status
    });
    res.status(201).json(block);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update block
router.put('/:id', async (req, res) => {
  try {
    const block = await Block.findByPk(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    await block.update({
      name: req.body.name || block.name,
      description: req.body.description || block.description,
      status: req.body.status || block.status
    });

    res.json(block);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE block
router.delete('/:id', async (req, res) => {
  try {
    const block = await Block.findByPk(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    await block.destroy();
    res.json({ message: 'Block deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;