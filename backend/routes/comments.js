const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Department = require('../models/Department');
const User = require('../models/User');

// GET comments, optionally filtered by activityId or taskId
router.get('/', async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.activityId) {
      whereClause.activityId = req.query.activityId;
    }
    if (req.query.taskId) {
      whereClause.taskId = req.query.taskId;
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

// Create a new comment for an activity or a task — gated by the
// `comments.manage` RBAC permission at the mount level in server.js
router.post('/', async (req, res) => {
  try {
    const { activityId, taskId, content, departmentId } = req.body;

    if (!content || !departmentId) {
      return res.status(400).json({ message: 'content and departmentId are required' });
    }
    if (!activityId && !taskId) {
      return res.status(400).json({ message: 'Either activityId or taskId is required' });
    }

    if (activityId) {
      const activity = await Activity.findByPk(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }
    }

    if (taskId) {
      const task = await Task.findByPk(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
    }

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const comment = await Comment.create({
      content,
      activityId: activityId || null,
      taskId: taskId || null,
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

// Update comment — gated by the `comments.manage` RBAC permission at the
// mount level in server.js; own-comment-or-Admin check enforced below
router.put('/:id', async (req, res) => {
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

// Delete comment — gated by the `comments.manage` RBAC permission at the
// mount level in server.js; own-comment-or-Admin check enforced below
router.delete('/:id', async (req, res) => {
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
