const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const User = require('../models/User');
const { clearPermissionCache } = require('../middleware/rbac');

// All routes here are mounted behind authMiddleware + adminMiddleware in
// server.js — only Admin/IT may reconfigure the RBAC matrix (§4).

// GET all roles (with permission keys + assigned user count)
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
      order: [['isSystem', 'DESC'], ['name', 'ASC']]
    });

    const userCounts = await User.findAll({ attributes: ['role'] });
    const countByRole = userCounts.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    const response = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      userCount: countByRole[role.name] || 0,
      permissionKeys: (role.permissions || []).map((p) => p.key)
    }));

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a new role
router.post('/roles', async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ message: 'Role name is required' });

    const role = await Role.create({
      name: req.body.name,
      description: req.body.description || null,
      isSystem: false
    });
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update a role's description (name/isSystem are immutable for system roles)
router.put('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    if (role.isSystem && req.body.name && req.body.name !== role.name) {
      return res.status(400).json({ message: 'System roles (Admin, Manager, User) cannot be renamed' });
    }

    await role.update({
      name: role.isSystem ? role.name : req.body.name || role.name,
      description: req.body.description !== undefined ? req.body.description : role.description
    });

    res.json(role);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a role — blocked for system roles or roles still assigned to users
router.delete('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.isSystem) return res.status(400).json({ message: 'System roles cannot be deleted' });

    const inUse = await User.count({ where: { role: role.name } });
    if (inUse > 0) {
      return res.status(400).json({ message: `Cannot delete role "${role.name}" — ${inUse} user(s) still assigned` });
    }

    await RolePermission.destroy({ where: { roleId: role.id } });
    await role.destroy();
    clearPermissionCache();
    res.json({ message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET the full permission catalog, grouped by module
router.get('/permissions', async (req, res) => {
  try {
    const permissions = await Permission.findAll({ order: [['module', 'ASC'], ['key', 'ASC']] });
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT replace a role's entire permission set — this IS the "adjust access
// without a code change" mechanism required by §4.
router.put('/role-permissions', async (req, res) => {
  try {
    const { roleId, permissionKeys } = req.body;
    if (!roleId || !Array.isArray(permissionKeys)) {
      return res.status(400).json({ message: 'roleId and permissionKeys[] are required' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    const permissions = await Permission.findAll({ where: { key: permissionKeys } });
    if (permissions.length !== permissionKeys.length) {
      return res.status(400).json({ message: 'One or more permission keys are invalid' });
    }

    await RolePermission.destroy({ where: { roleId } });
    await RolePermission.bulkCreate(
      permissions.map((p) => ({ roleId, permissionId: p.id }))
    );

    clearPermissionCache();

    const updated = await Role.findByPk(roleId, {
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
    });
    res.json({
      id: updated.id,
      name: updated.name,
      permissionKeys: (updated.permissions || []).map((p) => p.key)
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
