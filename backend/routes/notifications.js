const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { evaluateRules } = require('../services/notificationEngine');

// GET all notifications — filterable by recipient, status, module and read state.
// Regular users implicitly see only their own alerts; Admins may pass any userId.
router.get('/', async (req, res) => {
  try {
    const { userId, status, module, unreadOnly } = req.query;
    const where = {};

    const requester = req.user;
    if (userId) {
      where.userId = userId;
    } else if (requester && requester.role !== 'Admin' && requester.id) {
      where.userId = requester.id;
    }

    if (status) where.status = status;
    if (module) where.module = module;
    if (unreadOnly === 'true') where.read = false;

    const notifications = await Notification.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET notification by ID
router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new notification (manual / system-generated, not from a rule)
router.post('/', async (req, res) => {
  try {
    const newNotification = await Notification.create({
      message: req.body.message,
      type: req.body.type,
      read: req.body.read || false,
      userId: req.body.userId,
      module: req.body.module || 'Manual',
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      triggerType: req.body.triggerType || 'Manual',
      priority: req.body.priority || 'Medium',
      channels: req.body.channels,
      dueAt: req.body.dueAt
    });
    res.status(201).json(newNotification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update notification (generic field edit — prefer /acknowledge or /snooze for state changes)
router.put('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    await notification.update({
      message: req.body.message || notification.message,
      type: req.body.type || notification.type,
      read: req.body.read !== undefined ? req.body.read : notification.read,
      userId: req.body.userId || notification.userId
    });

    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/acknowledge — marks the alert Done. A comment is required for
// Critical-priority items (Requirements §5.2 business rule).
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    const { comment } = req.body;
    if (notification.priority === 'Critical' && !comment) {
      return res.status(400).json({ message: 'A comment is required to acknowledge a Critical alert' });
    }

    await notification.update({
      status: 'Acknowledged',
      read: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: req.user?.id || null,
      snoozeReason: comment || notification.snoozeReason
    });

    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/snooze — snoozes the alert until a given time. A reason is
// mandatory for Critical-priority items and is always logged (via the audit
// hook on the update itself, since Notification is a tracked model).
router.post('/:id/snooze', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    const { reason, snoozeUntil } = req.body;
    if (notification.priority === 'Critical' && !reason) {
      return res.status(400).json({ message: 'A reason is required to snooze a Critical alert' });
    }

    const defaultSnoozeMs = (notification.recurrenceIntervalHours || 24) * 3600 * 1000;
    const resolvedSnoozeUntil = snoozeUntil ? new Date(snoozeUntil) : new Date(Date.now() + defaultSnoozeMs);

    await notification.update({
      status: 'Snoozed',
      snoozeUntil: resolvedSnoozeUntil,
      snoozeReason: reason || null
    });

    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /run-check — Admin-only manual trigger of the notification engine
// sweep (useful for testing/ops without waiting for the schedule).
router.post('/run-check', async (req, res) => {
  try {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    await evaluateRules();
    res.json({ message: 'Notification engine sweep completed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    await notification.destroy();
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
