const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const User = require('../models/User');
const { roleToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

afterAll(async () => {
  await sequelize.close();
});

describe('Org Chart (§5.1)', () => {
  test('requires authentication', async () => {
    const res = await request(app).get('/api/org-chart');
    expect(res.status).toBe(401);
  });

  test('builds a tree from reportingManagerId', async () => {
    const manager = await makeUser({ role: 'Manager', firstName: 'Manager', lastName: 'Boss' });
    const report = await makeUser({ role: 'Team Member/Staff', firstName: 'Direct', lastName: 'Report', reportingManagerId: manager.id });
    const token = roleToken({ id: manager.id, role: 'Manager' });

    const res = await request(app).get('/api/org-chart').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const managerNode = res.body.find((n) => n.id === manager.id);
    expect(managerNode).toBeTruthy();
    expect(managerNode.reports.some((r) => r.id === report.id)).toBe(true);
  });
});
