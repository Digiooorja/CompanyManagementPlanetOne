const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');

// Short-lived cache of role name -> Set<permissionKey>, so a permission check
// doesn't hit the database on every request. Cleared whenever the matrix is
// edited via the Admin RBAC routes (see routes/rbac.js).
let cache = null; // Map<roleName, Set<string>>
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60 * 1000;

function clearPermissionCache() {
  cache = null;
}

async function loadPermissionMap() {
  if (cache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) return cache;

  const roles = await Role.findAll({
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
  });

  const map = new Map();
  for (const role of roles) {
    const keys = new Set((role.permissions || []).map((p) => p.key));
    map.set(role.name, keys);
  }

  cache = map;
  cacheLoadedAt = Date.now();
  return map;
}

// Express middleware factory: grants access if the caller's role holds
// `permissionKey` in the configurable RBAC matrix (§4). The legacy 'Admin'
// role remains a technical superuser for backward compatibility with the
// rest of the app (see REQUIREMENTS_GAP_CHECKLIST.md for rationale) — every
// other role, including the new business roles from §4, is governed purely
// by the matrix, so Admin can grant/revoke access without a code change.
function requirePermission(permissionKey) {
  return async (req, res, next) => {
    try {
      const role = req.user?.role;
      if (!role) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      if (role === 'Admin') {
        return next();
      }

      const map = await loadPermissionMap();
      const permissions = map.get(role);
      if (permissions && permissions.has(permissionKey)) {
        return next();
      }

      return res.status(403).json({ message: `Role "${role}" does not have the "${permissionKey}" permission` });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
}

module.exports = { requirePermission, clearPermissionCache, loadPermissionMap };
