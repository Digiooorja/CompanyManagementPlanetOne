const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// GET / — searchable, filterable, paginated audit trail.
// Supported query params: userId, module, entityType, entityId, action,
// dateFrom, dateTo, search, page, pageSize.
router.get('/', async (req, res) => {
  try {
    const {
      userId,
      module,
      entityType,
      entityId,
      action,
      dateFrom,
      dateTo,
      search,
      page = 1,
      pageSize = 50
    } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (module) where.module = module;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = String(entityId);
    if (action) where.action = action;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    if (search) {
      where[Op.or] = [
        { userEmail: { [Op.like]: `%${search}%` } },
        { module: { [Op.like]: `%${search}%` } },
        { entityType: { [Op.like]: `%${search}%` } },
        { entityId: { [Op.like]: `%${search}%` } }
      ];
    }

    const limit = Math.min(Number(pageSize) || 50, 500);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({ data: rows, total: count, page: Math.max(Number(page) || 1, 1), pageSize: limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /export — export the audit trail to CSV for audit submission (§5.4).
router.get('/export', async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ order: [['createdAt', 'DESC']], limit: 100000 });

    const headers = [
      'id',
      'timestamp',
      'userId',
      'userEmail',
      'userRole',
      'module',
      'entityType',
      'entityId',
      'action',
      'ipAddress'
    ];

    const escape = (value) => {
      if (value == null) return '';
      return `"${String(value).replace(/"/g, '""')}"`;
    };

    const lines = [headers.join(',')];
    for (const log of logs) {
      const timestamp = log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt;
      lines.push(
        [
          log.id,
          timestamp,
          log.userId,
          log.userEmail,
          log.userRole,
          log.module,
          log.entityType,
          log.entityId,
          log.action,
          log.ipAddress
        ]
          .map(escape)
          .join(',')
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /:id — single audit entry with full before/after payloads.
router.get('/:id', async (req, res) => {
  try {
    const log = await AuditLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ message: 'Audit log entry not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
