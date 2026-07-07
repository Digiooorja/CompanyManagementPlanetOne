/**
 * Test helper for signing throwaway JWTs matching the exact payload shape
 * backend/routes/auth.js produces at login, without needing a real user's
 * password. Admin bypasses the RBAC matrix entirely (see
 * backend/middleware/rbac.js), so most integration tests can just use
 * adminToken() to focus on the business logic under test; use roleToken()
 * for tests that specifically need to verify RBAC permission enforcement.
 */
const jwt = require('jsonwebtoken');

function roleToken({ id = 1, email = 'test@example.com', role = 'Admin', departmentId = null, department = null } = {}) {
  return jwt.sign({ id, email, role, departmentId, department }, process.env.JWT_SECRET, { expiresIn: '10m' });
}

function adminToken(overrides = {}) {
  return roleToken({ role: 'Admin', ...overrides });
}

module.exports = { roleToken, adminToken };
