const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const Project = require('../models/Project');
const Activity = require('../models/Activity');

// GET all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ association: 'departmentDetails', attributes: ['id', 'name'] }]
    });

    const response = users.map((user) => {
      const userJSON = user.toJSON();
      userJSON.department = userJSON.departmentDetails?.name || null;
      return userJSON;
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ association: 'departmentDetails', attributes: ['id', 'name'] }]
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const response = user.toJSON();
    response.department = user.departmentDetails?.name || null;
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new user
router.post('/users', async (req, res) => {
  try {
    let selectedDepartment = null;
    if (req.body.departmentId) {
      selectedDepartment = await Department.findByPk(req.body.departmentId);
      if (!selectedDepartment) {
        return res.status(400).json({ message: 'Invalid departmentId' });
      }
    } else if (req.body.department) {
      selectedDepartment = await Department.findOne({ where: { name: req.body.department } });
      if (!selectedDepartment) {
        return res.status(400).json({ message: 'Invalid department name' });
      }
    } else {
      selectedDepartment = await Department.findOne({ where: { name: 'Operations' } });
    }

    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      active: req.body.active !== undefined ? req.body.active : true,
      departmentId: selectedDepartment ? selectedDepartment.id : null
    });

    const response = user.toJSON();
    delete response.password;
    response.department = selectedDepartment ? selectedDepartment.name : null;
    response.departmentDetails = selectedDepartment ? { id: selectedDepartment.id, name: selectedDepartment.name } : null;
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update user
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let selectedDepartment = null;
    if (req.body.departmentId !== undefined) {
      selectedDepartment = await Department.findByPk(req.body.departmentId);
      if (!selectedDepartment) {
        return res.status(400).json({ message: 'Invalid departmentId' });
      }
    } else if (req.body.department !== undefined) {
      selectedDepartment = await Department.findOne({ where: { name: req.body.department } });
      if (!selectedDepartment) {
        return res.status(400).json({ message: 'Invalid department name' });
      }
    }

    await user.update({
      username: req.body.username || user.username,
      email: req.body.email || user.email,
      password: req.body.password || user.password,
      role: req.body.role || user.role,
      active: req.body.active !== undefined ? req.body.active : user.active,
      departmentId: selectedDepartment ? selectedDepartment.id : user.departmentId
    });

    await user.reload({
      include: [{ association: 'departmentDetails', attributes: ['id', 'name'] }]
    });

    const response = user.toJSON();
    delete response.password;
    response.department = user.departmentDetails?.name || null;
    res.json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalProjects, totalActivities] = await Promise.all([
      User.count(),
      User.count({ where: { active: true } }),
      Project.count(),
      Activity.count()
    ]);

    res.json({
      totalUsers,
      activeUsers,
      totalProjects,
      totalActivities
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;