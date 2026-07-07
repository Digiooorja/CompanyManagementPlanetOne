/**
 * Seeds a single Role + Permission(s) + RolePermission link directly via the
 * models (bypassing the full server.js startServer() seeding, which app.js
 * deliberately does not run to stay test/side-effect free). Use this in
 * tests that need to verify real RBAC permission enforcement for a
 * non-Admin role (Admin bypasses both the permission matrix and the
 * maker-checker separation-of-duties checks, so it can't exercise those
 * code paths).
 */
const Role = require('../../models/Role');
const Permission = require('../../models/Permission');
const RolePermission = require('../../models/RolePermission');
const { clearPermissionCache } = require('../../middleware/rbac');

// The real app (server.js startServer()) seeds these three as isSystem:true.
// Tests bypass that full seeding (see tests/globalSetup.js), so replicate the
// flag here too - otherwise business rules that check role.isSystem (e.g.
// "system roles cannot be renamed" in routes/admin.js) can't be tested.
const SYSTEM_ROLE_NAMES = new Set(['Admin', 'Manager', 'User']);

async function seedRolePermissions(roleName, permissionKeys) {
  const [role] = await Role.findOrCreate({
    where: { name: roleName },
    defaults: { name: roleName, isSystem: SYSTEM_ROLE_NAMES.has(roleName) },
  });

  for (const key of [].concat(permissionKeys)) {
    const [permission] = await Permission.findOrCreate({
      where: { key },
      defaults: { key, module: 'Test', description: 'Seeded for automated tests' },
    });
    await RolePermission.findOrCreate({ where: { roleId: role.id, permissionId: permission.id } });
  }

  clearPermissionCache();
  return role;
}

module.exports = { seedRolePermissions };
