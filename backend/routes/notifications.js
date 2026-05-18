const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.findAll();
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

// POST new notification
router.post('/', async (req, res) => {
  try {
    const newNotification = await Notification.create({
      message: req.body.message,
      type: req.body.type,
      read: req.body.read || false,
      userId: req.body.userId
    });
    res.status(201).json(newNotification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update notification
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