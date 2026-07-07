const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { roleToken } = require('./helpers/auth');
const { seedRolePermissions } = require('./helpers/seedRole');
const { makeUser } = require('./helpers/seedUser');

afterAll(async () => {
  await sequelize.close();
});

describe('RBAC permission matrix (tasks route)', () => {
  test('GET /api/tasks works without any token (guest/optional-auth read access)', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
  });

  test('POST /api/tasks with no token is rejected 401', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'should not be created' });
    expect(res.status).toBe(401);
  });

  test('POST /api/tasks with a role lacking tasks.manage is rejected 403', async () => {
    await seedRolePermissions('External Partner', ['reports.view']);
    const user = await makeUser({ role: 'External Partner' });
    const token = roleToken({ id: user.id, role: 'External Partner' });
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'should not be created' });
    expect(res.status).toBe(403);
  });

  test('POST /api/tasks with a role holding tasks.manage succeeds 201', async () => {
    await seedRolePermissions('Team Member/Staff', ['tasks.manage']);
    const user = await makeUser({ role: 'Team Member/Staff' });
    const token = roleToken({ id: user.id, role: 'Team Member/Staff' });
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'RBAC test task' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('RBAC test task');
  });

  test('Admin bypasses the matrix entirely', async () => {
    const admin = await makeUser({ role: 'Admin' });
    const token = roleToken({ id: admin.id, role: 'Admin' });
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'admin task' });
    expect(res.status).toBe(201);
  });
});
