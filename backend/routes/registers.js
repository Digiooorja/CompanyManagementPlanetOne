const express = require('express');
const router = express.Router();
const Register = require('../models/Register');

// GET all registers
router.get('/', async (req, res) => {
  try {
    const registers = await Register.findAll();
    res.json(registers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET register by ID
router.get('/:id', async (req, res) => {
  try {
    const register = await Register.findByPk(req.params.id);
    if (!register) return res.status(404).json({ message: 'Register not found' });
    res.json(register);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new register
router.post('/', async (req, res) => {
  try {
    const newRegister = await Register.create({
      name: req.body.name,
      type: req.body.type,
      value: req.body.value
    });
    res.status(201).json(newRegister);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update register
router.put('/:id', async (req, res) => {
  try {
    const register = await Register.findByPk(req.params.id);
    if (!register) return res.status(404).json({ message: 'Register not found' });

    await register.update({
      name: req.body.name || register.name,
      type: req.body.type || register.type,
      value: req.body.value || register.value
    });

    res.json(register);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE register
router.delete('/:id', async (req, res) => {
  try {
    const register = await Register.findByPk(req.params.id);
    if (!register) return res.status(404).json({ message: 'Register not found' });

    await register.destroy();
    res.json({ message: 'Register deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;