const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { Op } = require('sequelize');
const { optionalAuthMiddleware } = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');

async function autoAssignActivityTask(activity) {
  try {
    if (!activity.assignedTo) return;

    const assignName = String(activity.assignedTo).trim().toLowerCase();
    
    // Find matching user (simple heuristic)
    const users = await User.findAll();
    let matchedUser = users.find(u => {
      const usernameMatch = u.username && u.username.toLowerCase() === assignName;
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
      const nameMatch = fullName && fullName === assignName;
      const firstNameMatch = u.firstName && u.firstName.toLowerCase() === assignName;
      return usernameMatch || nameMatch || firstNameMatch;
    });

    if (matchedUser) {
      const existingTask = await Task.findOne({
        where: { relatedType: 'Activity', relatedId: activity.id }
      });

      let taskStatus = 'Not Started';
      if (activity.status === 'In Progress' || activity.progress > 0) taskStatus = 'In Progress';
      if (activity.status === 'Completed' || activity.progress >= 100) taskStatus = 'Completed';

      if (existingTask) {
        await existingTask.update({
          assignedToId: matchedUser.id,
          title: `Activity Assignment: ${activity.name}`,
          status: taskStatus !== 'Completed' && existingTask.status === 'Completed' ? existingTask.status : taskStatus
        });
      } else {
        await Task.create({
          title: `Activity Assignment: ${activity.name}`,
          description: activity.description || `You have been assigned to activity: ${activity.name}`,
          status: taskStatus,
          priority: activity.priority || 'Medium',
          dueDate: activity.dueDate ? new Date(activity.dueDate) : null,
          assignedToId: matchedUser.id,
          relatedType: 'Activity',
          relatedId: activity.id
        });
      }
    }
  } catch (err) {
    console.error('Failed to auto-assign activity task:', err);
  }
}

function getDepartmentName(user) {
  return String(user?.department || user?.departmentDetails?.name || '').toLowerCase();
}

function isOperationsUser(user) {
  const department = getDepartmentName(user);
  return user?.role === 'Admin' || department.includes('operation');
}

function isFinanceUser(user) {
  const department = getDepartmentName(user);
  return user?.role === 'Admin' || department.includes('finance');
}

// Apply optional auth to all routes (allows guests to read)
router.use(optionalAuthMiddleware);

async function sumSubActivityCosts(parentActivityId, excludeActivityId = null) {
  const where = { parentActivityId };
  if (excludeActivityId) {
    where.id = { [Op.ne]: excludeActivityId };
  }

  const subActivities = await Activity.findAll({
    where,
    attributes: ['plannedCost', 'actualCost']
  });

  return subActivities.reduce(
    (totals, child) => ({
      plannedCost: totals.plannedCost + parseFloat(child.plannedCost || 0),
      actualCost: totals.actualCost + parseFloat(child.actualCost || 0)
    }),
    { plannedCost: 0, actualCost: 0 }
  );
}

async function updateParentActualCost(parentActivityId) {
  const totals = await sumSubActivityCosts(parentActivityId);
  await Activity.update(
    { actualCost: totals.actualCost },
    { where: { id: parentActivityId } }
  );
  return totals.actualCost;
}

function getActivityDurationInDays(activity) {
  const plannedStart = activity.plannedStartDate ? new Date(activity.plannedStartDate) : null;
  const plannedEnd = activity.plannedEndDate ? new Date(activity.plannedEndDate) : null;
  const actualStart = activity.actualStartDate ? new Date(activity.actualStartDate) : null;
  const actualEnd = activity.actualEndDate ? new Date(activity.actualEndDate) : null;

  const startDate = plannedStart || actualStart;
  const endDate = plannedEnd || actualEnd;

  if (startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate >= startDate) {
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
  }

  return null;
}

async function updateParentProgress(parentActivityId, resetWhenEmpty = false) {
  if (!parentActivityId) return null;

  const parentActivity = await Activity.findByPk(parentActivityId);
  if (!parentActivity) return null;


  const subActivities = await Activity.findAll({
    where: { parentActivityId: parentActivity.id },
    attributes: ['id', 'progress', 'plannedStartDate', 'plannedEndDate', 'actualStartDate', 'actualEndDate']
  });

  if (subActivities.length > 0) {
    let totalWeightedProgress = 0;
    let totalWeight = 0;

    subActivities.forEach((child) => {
      const progress = Number.parseFloat(child.progress ?? 0);
      const durationDays = getActivityDurationInDays(child);
      const weight = durationDays && durationDays > 0 ? durationDays : 1;

      totalWeightedProgress += progress * weight;
      totalWeight += weight;
    });

    const weightedAverageProgress = totalWeight > 0
      ? Math.round(totalWeightedProgress / totalWeight)
      : Math.round(
          subActivities.reduce((sum, child) => sum + Number.parseFloat(child.progress ?? 0), 0) / subActivities.length
        );

    await Activity.update(
      { progress: weightedAverageProgress },
      { where: { id: parentActivity.id } }
    );
  } else if (resetWhenEmpty) {
    await Activity.update(
      { progress: 0 },
      { where: { id: parentActivity.id } }
    );
  }

  if (parentActivity.parentActivityId) {
    await updateParentProgress(parentActivity.parentActivityId, resetWhenEmpty);
  }

  return parentActivity.id;
}

async function updateActivityActualCostFromChildren(activityId) {
  const subActivities = await Activity.findAll({
    where: { parentActivityId: activityId },
    attributes: ['actualCost']
  });

  if (subActivities.length === 0) {
    return null;
  }

  const actualCost = subActivities.reduce(
    (sum, child) => sum + parseFloat(child.actualCost || 0),
    0
  );

  await Activity.update(
    { actualCost },
    { where: { id: activityId } }
  );

  return actualCost;
}

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
            'actualCost',
            'order'
          ],
          order: [['order', 'ASC']]
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
      order: [['order', 'ASC']]
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET activity by ID with sub-activities
async function getActivityHierarchy(activityId) {
  const activity = await Activity.findByPk(activityId, {
    attributes: ['id', 'name', 'parentActivityId']
  });
  if (!activity) return [];
  if (!activity.parentActivityId) return [{ id: activity.id, name: activity.name }];
  const parentHierarchy = await getActivityHierarchy(activity.parentActivityId);
  return [...parentHierarchy, { id: activity.id, name: activity.name }];
}

router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        {
          association: 'subActivities',
          attributes: ['id', 'name', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'progress', 'parentActivityId', 'plannedCost', 'actualCost', 'order'],
          order: [['order', 'ASC']],
          include: [
            {
              association: 'subActivities',
              attributes: ['id']
            }
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
      ]
    });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    
    const hierarchy = await getActivityHierarchy(activity.id);
    const responseData = activity.toJSON();
    responseData.hierarchy = hierarchy;
    
    res.json(responseData);
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
      order: [['order', 'ASC']]
    });
    res.json(subActivities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new activity (parent or sub-activity)
router.post('/', async (req, res) => {
  try {
    if (!isOperationsUser(req.user)) {
      return res.status(403).json({ message: 'Only Operations department users can create activities' });
    }

    const plannedCost = req.body.plannedCost !== undefined ? parseFloat(req.body.plannedCost) || 0 : 0;
    const actualCost = req.body.actualCost !== undefined ? parseFloat(req.body.actualCost) || 0 : 0;
    let parentActivity = null;

    if (req.body.parentActivityId) {
      parentActivity = await Activity.findByPk(req.body.parentActivityId);
      if (!parentActivity) {
        return res.status(404).json({ message: 'Parent activity not found' });
      }

      const totals = await sumSubActivityCosts(parentActivity.id);
      if (parseFloat(parentActivity.plannedCost || 0) > 0 && totals.plannedCost + plannedCost > parseFloat(parentActivity.plannedCost || 0)) {
        return res.status(400).json({ message: 'Planned cost for sub-activities cannot exceed parent activity planned cost' });
      }
    }

    // Calculate next order for this parent/project combination
    const siblings = await Activity.findAll({
      where: {
        parentActivityId: req.body.parentActivityId || null,
        projectId: req.body.projectId || null
      },
      attributes: ['order'],
      raw: true
    });
    
    const maxOrder = siblings.length > 0 
      ? Math.max(...siblings.map(s => s.order || 0))
      : 0;
    const nextOrder = maxOrder + 1;

    const activity = await Activity.create({
      name: req.body.name,
      description: req.body.description,
      status: req.body.status || 'Active',
      parentActivityId: req.body.parentActivityId || null,
      projectId: req.body.projectId || null,
      priority: req.body.priority || 'Medium',
      assignedTo: req.body.assignedTo || null,
      dueDate: req.body.dueDate || null,
      plannedStartDate: req.body.plannedStartDate || null,
      plannedEndDate: req.body.plannedEndDate || null,
      progress: req.body.progress || 0,
      plannedCost,
      actualCost,
      order: nextOrder
    });

    if (parentActivity) {
      await updateParentActualCost(parentActivity.id);
      await updateParentProgress(parentActivity.id);
    }
    
    await autoAssignActivityTask(activity);

    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT - Update activity order (must come before /:id to match correctly)
router.put('/:id/order', async (req, res) => {
  try {
    if (!isOperationsUser(req.user)) {
      return res.status(403).json({ message: 'Only Operations department users can update activity order' });
    }

    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const childCount = await Activity.count({ where: { parentActivityId: activity.id } });
    console.log(`[PUT Activity] Updating activity ${activity.id} (${activity.name}), parentId=${activity.parentActivityId}, newProgress=${req.body.progress}, hasChildren=${childCount}`);

    const { direction } = req.body; // 'up' or 'down'
    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ message: 'Direction must be "up" or "down"' });
    }

    // Find all activities with same parent/project to determine new order
    const whereClause = {
      parentActivityId: activity.parentActivityId,
      projectId: activity.projectId
    };

    const siblings = await Activity.findAll({
      where: whereClause,
      order: [['order', 'ASC']]
    });

    const currentIndex = siblings.findIndex(a => a.id === activity.id);
    
    if (direction === 'up' && currentIndex === 0) {
      return res.status(400).json({ message: 'Activity is already at the top' });
    }
    if (direction === 'down' && currentIndex === siblings.length - 1) {
      return res.status(400).json({ message: 'Activity is already at the bottom' });
    }

    if (direction === 'up' && currentIndex > 0) {
      const sibling = siblings[currentIndex - 1];
      await activity.update({ order: sibling.order });
      await sibling.update({ order: activity.order });
    } else if (direction === 'down' && currentIndex < siblings.length - 1) {
      const sibling = siblings[currentIndex + 1];
      await activity.update({ order: sibling.order });
      await sibling.update({ order: activity.order });
    }

    const updatedActivity = await Activity.findByPk(activity.id);
    res.json(updatedActivity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update activity
router.put('/:id', async (req, res) => {
  try {
    const departmentName = getDepartmentName(req.user);
    const isAdmin = req.user.role === 'Admin';
    const isOperations = departmentName.includes('operation');
    const isFinance = departmentName.includes('finance');

    if (!isAdmin && !isOperations && !isFinance) {
      return res.status(403).json({ message: 'Unauthorized to update activity' });
    }

    if (isFinance) {
      const nonActualFields = Object.keys(req.body).filter((key) => key !== 'actualCost');
      if (nonActualFields.length > 0) {
        return res.status(403).json({ message: 'Finance users can only update actualCost for activities' });
      }
    }

    if (!isAdmin && !isFinance && req.body.actualCost !== undefined) {
      return res.status(403).json({ message: 'Only Finance users or Admin can update actualCost' });
    }

    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const oldParentActivityId = activity.parentActivityId;
    const newParentActivityId = req.body.parentActivityId !== undefined ? req.body.parentActivityId : oldParentActivityId;
    const plannedCost = req.body.plannedCost !== undefined ? parseFloat(req.body.plannedCost) || 0 : parseFloat(activity.plannedCost || 0);
    const actualCost = req.body.actualCost !== undefined ? parseFloat(req.body.actualCost) || 0 : parseFloat(activity.actualCost || 0);

    if (req.body.parentActivityId !== undefined && req.body.parentActivityId !== oldParentActivityId) {
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

    if (newParentActivityId) {
      const parentActivity = await Activity.findByPk(newParentActivityId);
      const totals = await sumSubActivityCosts(newParentActivityId, activity.id);
      if (parseFloat(parentActivity.plannedCost || 0) > 0 && totals.plannedCost + plannedCost > parseFloat(parentActivity.plannedCost || 0)) {
        return res.status(400).json({ message: 'Planned cost for sub-activities cannot exceed parent activity planned cost' });
      }
    }

    if (!newParentActivityId) {
      const childTotals = await sumSubActivityCosts(activity.id);
      if (childTotals.plannedCost > plannedCost) {
        return res.status(400).json({ message: 'Activity planned cost cannot be less than the sum of its sub-activities planned cost' });
      }
    }

    const childCount = await Activity.count({ where: { parentActivityId: activity.id } });
    console.log(`[PUT Activity] Updating activity ${activity.id} (${activity.name}), childCount=${childCount}, oldParent=${oldParentActivityId}, newParent=${newParentActivityId}, reqBodyProgress=${req.body.progress}`);

    // If activity has children and user tries to update progress manually, ignore it
    const progressToSet = (childCount > 0 && req.body.progress !== undefined)
      ? activity.progress  // Keep existing progress, will be recalculated from children
      : (req.body.progress !== undefined ? req.body.progress : activity.progress);

    const updated = await activity.update({
      name: req.body.name || activity.name,
      description: req.body.description || activity.description,
      status: req.body.status || activity.status,
      parentActivityId: newParentActivityId,
      projectId: req.body.projectId !== undefined ? req.body.projectId : activity.projectId,
      priority: req.body.priority || activity.priority,
      assignedTo: req.body.assignedTo !== undefined ? req.body.assignedTo : activity.assignedTo,
      dueDate: req.body.dueDate !== undefined ? req.body.dueDate : activity.dueDate,
      plannedStartDate: req.body.plannedStartDate !== undefined ? req.body.plannedStartDate : activity.plannedStartDate,
      plannedEndDate: req.body.plannedEndDate !== undefined ? req.body.plannedEndDate : activity.plannedEndDate,
      progress: progressToSet,
      plannedCost,
      actualCost
    });

    console.log(`[PUT Activity] Activity ${activity.id} updated. progressToSet=${progressToSet}, afterUpdateProgress=${updated.progress}, parentActivityId=${updated.parentActivityId}`);

    // Recalculate this activity's own progress from its sub-activities (if any).
    // This ensures that any manually supplied progress value is overridden by the
    // weighted-average calculation whenever children exist.
    await updateParentProgress(activity.id);

    // If this is a sub-activity and progress was updated, ALWAYS propagate to parent
    // This is critical for the hierarchy to update correctly
    const parentId = req.body.parentActivityId !== undefined ? req.body.parentActivityId : oldParentActivityId;
    if (req.body.progress !== undefined) {
      if (parentId) {
        console.log(`[Activities] Sub-activity ${activity.id} progress updated (${req.body.progress}%), updating parent ${parentId}`);
        await updateParentProgress(parentId);
      } else {
        console.log(`[Activities] Sub-activity ${activity.id} progress updated (${req.body.progress}%), but no parent found to recalc`);
      }
    }

    if (oldParentActivityId && oldParentActivityId !== newParentActivityId) {
      await updateParentActualCost(oldParentActivityId);
      await updateParentProgress(oldParentActivityId, true);
    }
    if (newParentActivityId) {
      await updateParentActualCost(newParentActivityId);
      await updateParentProgress(newParentActivityId);
    } else if (oldParentActivityId) {
      await updateParentProgress(oldParentActivityId);
    }

    await updateActivityActualCostFromChildren(activity.id);

    const updatedActivity = await Activity.findByPk(activity.id, {
      include: [{
        association: 'subActivities',
        attributes: ['id', 'name', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'progress', 'parentActivityId', 'plannedCost', 'actualCost']
      }]
    });
    
    await autoAssignActivityTask(updatedActivity);

    res.json(updatedActivity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE activity (cascades to sub-activities)
router.delete('/:id', async (req, res) => {
  try {
    if (!isOperationsUser(req.user)) {
      return res.status(403).json({ message: 'Only Operations department users can delete activities' });
    }

    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const parentActivityId = activity.parentActivityId;
    await activity.destroy();

    if (parentActivityId) {
      await updateParentActualCost(parentActivityId);
      await updateParentProgress(parentActivityId, true);
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - Update multiple activities (for bulk progress update)
router.post('/bulk/update', async (req, res) => {
  try {
    if (!isOperationsUser(req.user)) {
      return res.status(403).json({ message: 'Only Operations department users can bulk update activities' });
    }

    const { activities } = req.body;
    if (!Array.isArray(activities)) {
      return res.status(400).json({ message: 'Activities must be an array' });
    }

    const updates = await Promise.all(
      activities.map(async (actData) => {
        const activity = await Activity.findByPk(actData.id);
        if (activity) {
          const updatedActivity = await activity.update({
            status: actData.status || activity.status,
            progress: actData.progress !== undefined ? actData.progress : activity.progress
          });

          if (updatedActivity.parentActivityId) {
            await updateParentProgress(updatedActivity.parentActivityId);
          }

          return updatedActivity;
        }
      })
    );

    res.json(updates);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;