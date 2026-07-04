const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/org-chart - Auto-generated interactive org chart (Requirements
// §5.1). Builds a tree from each user's reportingManagerId. Re-renders
// automatically whenever a reporting line changes, since it's computed live
// from the current data rather than stored/cached.
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { active: true },
      attributes: ['id', 'username', 'firstName', 'lastName', 'designation', 'departmentId', 'reportingManagerId', 'photoUrl', 'role'],
      include: [{ association: 'departmentDetails', attributes: ['id', 'name'] }]
    });

    const nodesById = new Map();
    for (const user of users) {
      const json = user.toJSON();
      nodesById.set(json.id, {
        id: json.id,
        name: `${json.firstName || ''} ${json.lastName || ''}`.trim() || json.username,
        designation: json.designation || null,
        department: json.departmentDetails?.name || null,
        role: json.role,
        photoUrl: json.photoUrl || null,
        reportingManagerId: json.reportingManagerId || null,
        reports: []
      });
    }

    const roots = [];
    for (const node of nodesById.values()) {
      if (node.reportingManagerId && nodesById.has(node.reportingManagerId)) {
        nodesById.get(node.reportingManagerId).reports.push(node);
      } else {
        roots.push(node);
      }
    }

    res.json(roots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
