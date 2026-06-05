const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { Op } = require('sequelize');

// GET /api/tasks - Get all tasks (manager access or related to logged user)
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'Assigner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/my - Get tasks assigned to the logged-in user
router.get('/my', async (req, res) => {
  try {
    // Assuming req.user is set by auth middleware
    const userId = req.user ? req.user.id : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tasks = await Task.findAll({
      where: {
        assignedToId: userId
      },
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'Assigner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ],
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching my tasks:', err);
    res.status(500).json({ error: 'Failed to fetch your tasks' });
  }
});

// GET /api/tasks/assigned-by-me - Get tasks created by the logged-in user
router.get('/assigned-by-me', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tasks = await Task.findAll({
      where: {
        assignedById: userId
      },
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'Assigner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching assigned tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks assigned by you' });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'Assigner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    
    const { title, description, status, priority, dueDate, assignedToId, relatedType, relatedId } = req.body;
    
    const newTask = await Task.create({
      title,
      description,
      status: status || 'Not Started',
      priority: priority || 'Medium',
      dueDate,
      assignedToId: assignedToId || userId, // Assign to self if not specified
      assignedById: userId,
      relatedType,
      relatedId
    });
    
    // Fetch with included users to return complete object
    const createdTask = await Task.findByPk(newTask.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'Assigner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    
    res.status(201).json(createdTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const { title, description, status, priority, dueDate, assignedToId, relatedType, relatedId } = req.body;
    
    await task.update({
      title: title !== undefined ? title : task.title,
      description: description !== undefined ? description : task.description,
      status: status !== undefined ? status : task.status,
      priority: priority !== undefined ? priority : task.priority,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      assignedToId: assignedToId !== undefined ? assignedToId : task.assignedToId,
      relatedType: relatedType !== undefined ? relatedType : task.relatedType,
      relatedId: relatedId !== undefined ? relatedId : task.relatedId
    });
    
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'Assigner', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ]
    });
    
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
