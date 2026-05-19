const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const Department = require('../models/Department');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// GET comments, optionally filtered by activityId
router.get('/', async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.activityId) {
      whereClause.activityId = req.query.activityId;
    }

    const comments = await Comment.findAll({
      where: whereClause,
      include: [
        {
          association: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
        {
          association: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new comment for an activity
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { activityId, content, departmentId } = req.body;

    if (!activityId || !content || !departmentId) {
      return res.status(400).json({ message: 'activityId, content, and departmentId are required' });
    }

    const activity = await Activity.findByPk(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const comment = await Comment.create({
      content,
      activityId,
      userId: req.user.id,
      departmentId
    });

    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          association: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
        {
          association: 'department',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json(createdComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update comment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { content, departmentId } = req.body;
    const updates = {
      content: content !== undefined ? content : comment.content
    };

    if (departmentId !== undefined) {
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
      updates.departmentId = departmentId;
    }

    await comment.update(updates);

    const updatedComment = await Comment.findByPk(comment.id, {
      include: [
        {
          association: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
        {
          association: 'department',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json(updatedComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete comment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
