const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new department
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const [department] = await Department.findOrCreate({
      where: { name },
      defaults: { description }
    });

    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
