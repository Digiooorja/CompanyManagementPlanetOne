const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');
const { seedRolePermissions } = require('./helpers/seedRole');

const admin = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('RBAC matrix administration (§4, Admin-only)', () => {
  test('rejects a non-Admin', async () => {
    const managerToken = roleToken({ id: 3201, role: 'Manager' });
    const res = await request(app).get('/api/admin/roles').set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  test('Admin can list roles with their permission keys', async () => {
    await seedRolePermissions('Manager', ['tasks.manage']);
    const res = await request(app).get('/api/admin/roles').set('Authorization', `Bearer ${admin}`);
    expect(res.status).toBe(200);
    const manager = res.body.find((r) => r.name === 'Manager');
    expect(manager.permissionKeys).toContain('tasks.manage');
  });

  test('Admin can create a new custom role', async () => {
    const res = await request(app)
      .post('/api/admin/roles')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Custom Test Role', description: 'A test role' });
    expect(res.status).toBe(201);
    expect(res.body.isSystem).toBe(false);
  });

  test('system roles cannot be renamed', async () => {
    const rolesRes = await request(app).get('/api/admin/roles').set('Authorization', `Bearer ${admin}`);
    const managerRole = rolesRes.body.find((r) => r.name === 'Manager');
    const res = await request(app)
      .put(`/api/admin/roles/${managerRole.id}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Renamed Manager' });
    expect(res.status).toBe(400);
  });
});
