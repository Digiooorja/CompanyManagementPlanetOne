const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const admin = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Notification Rules (§10.4, Admin-only)', () => {
  test('rejects a non-Admin entirely', async () => {
    const managerToken = roleToken({ id: 3001, role: 'Manager' });
    const res = await request(app).get('/api/notification-rules').set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  test('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/notification-rules');
    expect(res.status).toBe(401);
  });

  test('Admin can create and read back a rule', async () => {
    const createRes = await request(app)
      .post('/api/notification-rules')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Test Rule', module: 'Task', triggerType: 'DateBased', dateField: 'dueDate', leadTimeDays: [3, 1] });
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/api/notification-rules').set('Authorization', `Bearer ${admin}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((r) => r.name === 'Test Rule')).toBe(true);
  });
});
