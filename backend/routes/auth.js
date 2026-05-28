const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, department, departmentId, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    let selectedDepartment = null;
    if (departmentId) {
      selectedDepartment = await Department.findByPk(departmentId);
      if (!selectedDepartment) {
        return res.status(400).json({ error: 'Invalid departmentId' });
      }
    } else if (department) {
      selectedDepartment = await Department.findOne({ where: { name: department } });
      if (!selectedDepartment) {
        return res.status(400).json({ error: 'Invalid department name' });
      }
    } else {
      selectedDepartment = await Department.findOne({ where: { name: 'Operations' } });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      departmentId: selectedDepartment ? selectedDepartment.id : null,
      role: role || 'User'
    });

    const departmentName = selectedDepartment ? selectedDepartment.name : null;

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        department: departmentName
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        departmentId: user.departmentId,
        department: departmentName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [
        {
          association: 'departmentDetails',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const departmentName = user.departmentDetails?.name || null;

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        department: departmentName
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        departmentId: user.departmentId,
        department: departmentName,
        departmentDetails: user.departmentDetails,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'departmentDetails',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = user.toJSON();
    result.department = user.departmentDetails?.name || null;

    res.json(result);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get all users (admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'departmentDetails',
          attributes: ['id', 'name']
        }
      ]
    });

    const response = users.map((user) => {
      const userJSON = user.toJSON();
      userJSON.department = userJSON.departmentDetails?.name || null;
      return userJSON;
    });

    res.json(response);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, department, departmentId, role, active } = req.body;

    // Check authorization - can only update own profile unless admin
    if (req.user.id !== parseInt(id) && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let selectedDepartment = null;
    if (departmentId !== undefined) {
      selectedDepartment = await Department.findByPk(departmentId);
      if (!selectedDepartment) {
        return res.status(400).json({ error: 'Invalid departmentId' });
      }
    } else if (department !== undefined) {
      selectedDepartment = await Department.findOne({ where: { name: department } });
      if (!selectedDepartment) {
        return res.status(400).json({ error: 'Invalid department name' });
      }
    }

    await user.update({
      firstName,
      lastName,
      departmentId: selectedDepartment ? selectedDepartment.id : user.departmentId,
      role: req.user.role === 'Admin' ? role : user.role, // Only admins can change role
      active: req.user.role === 'Admin' ? active : user.active // Only admins can deactivate
    });

    await user.reload({
      include: [
        {
          association: 'departmentDetails',
          attributes: ['id', 'name']
        }
      ]
    });

    const result = user.toJSON();
    result.department = user.departmentDetails?.name || null;

    res.json({
      message: 'User updated successfully',
      user: result
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Logout (frontend handles token removal)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
