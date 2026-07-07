const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { Op } = require('sequelize');
const { syncAllOverdueTasks, recalcParentTaskProgress, recalcProjectCompletionForTask } = require('../services/taskStatusSync');

const ASSIGNEE_ATTRS = ['id', 'username', 'firstName', 'lastName'];
const taskIncludes = [
  { model: User, as: 'Assignee', attributes: ASSIGNEE_ATTRS },
  { model: User, as: 'Assigner', attributes: ASSIGNEE_ATTRS }
];

// GET /api/tasks/workload - Per-person open-task counts across the whole org
// (Requirements §5.3 acceptance criteria: "Workload dashboard shows accurate
// open-task count per person"). Must be registered before '/:id'.
router.get('/workload', async (req, res) => {
  try {
    await syncAllOverdueTasks();

    const tasks = await Task.findAll({
      where: { status: { [Op.ne]: 'Completed' } },
      include: [{ model: User, as: 'Assignee', attributes: ASSIGNEE_ATTRS }]
    });

    const byUser = new Map();
    for (const task of tasks) {
      const key = task.assignedToId || 'unassigned';
      if (!byUser.has(key)) {
        const assignee = task.Assignee;
        const name = assignee
          ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.username
          : 'Unassigned';
        byUser.set(key, { userId: task.assignedToId || null, name, openTasks: 0, overdueTasks: 0 });
      }
      const entry = byUser.get(key);
      entry.openTasks += 1;
      if (task.status === 'Overdue') entry.overdueTasks += 1;
    }

    res.json(Array.from(byUser.values()).sort((a, b) => b.openTasks - a.openTasks));
  } catch (err) {
    console.error('Error computing task workload:', err);
    res.status(500).json({ error: 'Failed to compute workload' });
  }
});

// GET /api/tasks - Get all tasks (manager access or related to logged user)
router.get('/', async (req, res) => {
  try {
    await syncAllOverdueTasks();
    const tasks = await Task.findAll({
      include: taskIncludes,
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
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await syncAllOverdueTasks();

    const tasks = await Task.findAll({
      where: { assignedToId: userId },
      include: taskIncludes,
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

    await syncAllOverdueTasks();

    const tasks = await Task.findAll({
      where: { assignedById: userId },
      include: taskIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching assigned tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks assigned by you' });
  }
});

// GET /api/tasks/:id - Get task by ID (includes subtasks)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        ...taskIncludes,
        { model: Task, as: 'subtasks', include: [{ model: User, as: 'Assignee', attributes: ASSIGNEE_ATTRS }] }
      ]
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// GET /api/tasks/:id/subtasks
router.get('/:id/subtasks', async (req, res) => {
  try {
    const subtasks = await Task.findAll({
      where: { parentTaskId: req.params.id },
      include: taskIncludes,
      order: [['createdAt', 'ASC']]
    });
    res.json(subtasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id/history - Full status-change history from the central
// Audit Log (Requirements §5.3 acceptance criteria + §5.4).
router.get('/:id/history', async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      where: { entityType: 'Task', entityId: String(req.params.id) },
      order: [['createdAt', 'ASC']]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks - Create a new task (optionally as a subtask via parentTaskId)
router.post('/', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    const {
      title, description, status, priority, startDate, dueDate, assignedToId,
      relatedType, relatedId, parentTaskId, dependencyTaskIds
    } = req.body;

    if (parentTaskId) {
      const parent = await Task.findByPk(parentTaskId);
      if (!parent) return res.status(404).json({ error: 'Parent task not found' });
    }

    const newTask = await Task.create({
      title,
      description,
      status: status || 'Not Started',
      priority: priority || 'Medium',
      startDate: startDate || null,
      dueDate,
      progress: 0,
      parentTaskId: parentTaskId || null,
      dependencyTaskIds: dependencyTaskIds || [],
      assignedToId: assignedToId || userId, // Assign to self if not specified
      assignedById: userId,
      relatedType,
      relatedId
    });

    if (parentTaskId) {
      await recalcParentTaskProgress(parentTaskId);
      const parentTask = await Task.findByPk(parentTaskId);
      await recalcProjectCompletionForTask(parentTask);
    }
    await recalcProjectCompletionForTask(newTask);

    const createdTask = await Task.findByPk(newTask.id, { include: taskIncludes });
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

    const {
      title, description, status, priority, startDate, dueDate, assignedToId,
      relatedType, relatedId, parentTaskId, dependencyTaskIds, progress
    } = req.body;

    // Business rule (§5.3): a task cannot be marked 100% complete without
    // the owner's confirmation — only the assigned owner or an Admin may
    // set status to Completed or progress to 100.
    const wantsComplete = status === 'Completed' || (progress !== undefined && Number(progress) >= 100);
    if (wantsComplete) {
      const isOwner = req.user && req.user.id === task.assignedToId;
      const isAdmin = req.user && req.user.role === 'Admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only the task owner can confirm 100% completion' });
      }
    }

    const oldParentTaskId = task.parentTaskId;
    const oldRelatedType = task.relatedType;
    const oldRelatedId = task.relatedId;

    await task.update({
      title: title !== undefined ? title : task.title,
      description: description !== undefined ? description : task.description,
      status: status !== undefined ? status : task.status,
      priority: priority !== undefined ? priority : task.priority,
      startDate: startDate !== undefined ? startDate : task.startDate,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      progress: progress !== undefined ? progress : task.progress,
      parentTaskId: parentTaskId !== undefined ? parentTaskId : task.parentTaskId,
      dependencyTaskIds: dependencyTaskIds !== undefined ? dependencyTaskIds : task.dependencyTaskIds,
      assignedToId: assignedToId !== undefined ? assignedToId : task.assignedToId,
      relatedType: relatedType !== undefined ? relatedType : task.relatedType,
      relatedId: relatedId !== undefined ? relatedId : task.relatedId
    });

    // Roll up progress to the parent task, both old and new parent if it moved.
    if (task.parentTaskId) await recalcParentTaskProgress(task.parentTaskId);
    if (oldParentTaskId && oldParentTaskId !== task.parentTaskId) await recalcParentTaskProgress(oldParentTaskId);

    // Roll up progress to the Project (§5.3 task -> project roll-up), for both
    // this task's current project and its previous one if it was reassigned.
    await recalcProjectCompletionForTask(task);
    if (oldRelatedType !== task.relatedType || oldRelatedId !== task.relatedId) {
      await recalcProjectCompletionForTask({ relatedType: oldRelatedType, relatedId: oldRelatedId });
    }
    if (task.parentTaskId) {
      await recalcProjectCompletionForTask(await Task.findByPk(task.parentTaskId));
    }
    if (oldParentTaskId && oldParentTaskId !== task.parentTaskId) {
      await recalcProjectCompletionForTask(await Task.findByPk(oldParentTaskId));
    }

    // Re-run the overdue sweep so a status/progress edit is reflected immediately.
    await syncAllOverdueTasks();

    const updatedTask = await Task.findByPk(task.id, { include: taskIncludes });
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

    const parentTaskId = task.parentTaskId;
    const relatedType = task.relatedType;
    const relatedId = task.relatedId;
    await task.destroy();

    if (parentTaskId) {
      await recalcParentTaskProgress(parentTaskId);
      await recalcProjectCompletionForTask(await Task.findByPk(parentTaskId));
    }
    await recalcProjectCompletionForTask({ relatedType, relatedId });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;

