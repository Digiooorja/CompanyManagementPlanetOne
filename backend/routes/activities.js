const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { Op } = require('sequelize');

// GET all parent activities with sub-activities
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    
    const whereClause = {};
    if (!projectId) {
      whereClause.parentActivityId = null;
    }
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    const activities = await Activity.findAll({
      where: whereClause,
      include: [
        {
          association: 'subActivities',
          attributes: [
            'id',
            'name',
            'description',
            'status',
            'priority',
            'assignedTo',
            'dueDate',
            'progress',
            'parentActivityId',
            'plannedStartDate',
            'plannedEndDate',
            'actualStartDate',
            'actualEndDate',
            'plannedCost',
            'actualCost'
          ]
        },
        {
          association: 'project',
          attributes: ['id', 'name', 'description', 'status']
        },
        {
          association: 'comments',
          include: [
            {
              association: 'author',
              attributes: ['id', 'username', 'firstName', 'lastName']
            },
            {
              association: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET activity by ID with sub-activities
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        {
          association: 'subActivities',
          attributes: ['id', 'name', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'progress', 'parentActivityId']
        },
        {
          association: 'project',
          attributes: ['id', 'name', 'description', 'status']
        },
        {
          association: 'comments',
          include: [
            {
              association: 'author',
              attributes: ['id', 'username', 'firstName', 'lastName']
            },
            {
              association: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET sub-activities for a parent activity
router.get('/:id/sub-activities', async (req, res) => {
  try {
    const subActivities = await Activity.findAll({
      where: {
        parentActivityId: req.params.id
      },
      order: [['createdAt', 'ASC']]
    });
    res.json(subActivities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new activity (parent or sub-activity)
router.post('/', async (req, res) => {
  try {
    // If parentActivityId is provided, validate it exists
    if (req.body.parentActivityId) {
      const parentActivity = await Activity.findByPk(req.body.parentActivityId);
      if (!parentActivity) {
        return res.status(404).json({ message: 'Parent activity not found' });
      }
    }

    const activity = await Activity.create({
      name: req.body.name,
      description: req.body.description,
      status: req.body.status || 'Active',
      parentActivityId: req.body.parentActivityId || null,
      projectId: req.body.projectId || null,
      priority: req.body.priority || 'Medium',
      assignedTo: req.body.assignedTo || null,
      dueDate: req.body.dueDate || null,
      progress: req.body.progress || 0
    });
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update activity
router.put('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    // If trying to set a new parentActivityId, validate it exists and prevent self-reference
    if (req.body.parentActivityId !== undefined && req.body.parentActivityId !== activity.parentActivityId) {
      if (req.body.parentActivityId) {
        if (req.body.parentActivityId === activity.id) {
          return res.status(400).json({ message: 'Cannot set an activity as its own parent' });
        }
        const parentActivity = await Activity.findByPk(req.body.parentActivityId);
        if (!parentActivity) {
          return res.status(404).json({ message: 'Parent activity not found' });
        }
      }
    }

    await activity.update({
      name: req.body.name || activity.name,
      description: req.body.description || activity.description,
      status: req.body.status || activity.status,
      parentActivityId: req.body.parentActivityId !== undefined ? req.body.parentActivityId : activity.parentActivityId,
      projectId: req.body.projectId !== undefined ? req.body.projectId : activity.projectId,
      priority: req.body.priority || activity.priority,
      assignedTo: req.body.assignedTo !== undefined ? req.body.assignedTo : activity.assignedTo,
      dueDate: req.body.dueDate !== undefined ? req.body.dueDate : activity.dueDate,
      progress: req.body.progress !== undefined ? req.body.progress : activity.progress
    });

    const updatedActivity = await Activity.findByPk(activity.id, {
      include: [{
        association: 'subActivities',
        attributes: ['id', 'name', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'progress', 'parentActivityId']
      }]
    });

    res.json(updatedActivity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE activity (cascades to sub-activities)
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    // Delete cascade is handled by database foreign key constraint
    await activity.destroy();
    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - Update multiple activities (for bulk progress update)
router.post('/bulk/update', async (req, res) => {
  try {
    const { activities } = req.body;
    if (!Array.isArray(activities)) {
      return res.status(400).json({ message: 'Activities must be an array' });
    }

    const updates = await Promise.all(
      activities.map(async (actData) => {
        const activity = await Activity.findByPk(actData.id);
        if (activity) {
          return activity.update({
            status: actData.status || activity.status,
            progress: actData.progress !== undefined ? actData.progress : activity.progress
          });
        }
      })
    );

    res.json(updates);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;