const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

let admin;

beforeAll(async () => {
  const adminUser = await makeUser({ role: 'Admin' });
  admin = adminToken({ id: adminUser.id });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Admin — user management (§5.1, Admin-only)', () => {
  test('rejects a non-Admin entirely', async () => {
    const managerToken = roleToken({ id: 3301, role: 'Manager' });
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  test('lists users without leaking password hashes', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${admin}`);
    expect(res.status).toBe(200);
    expect(res.body.every((u) => u.password === undefined)).toBe(true);
  });

  test('deactivating a user triggers an offboarding notification to Admins (§5.1)', async () => {
    const staff = await makeUser({ role: 'Team Member/Staff', active: true });
    const res = await request(app)
      .put(`/api/admin/users/${staff.id}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });
});
