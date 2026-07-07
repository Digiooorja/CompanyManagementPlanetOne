const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Task = require('../models/Task');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Decision Log (§5.13)', () => {
  let decisionId;

  test('GET /api/decisions works without auth', async () => {
    const res = await request(app).get('/api/decisions');
    expect(res.status).toBe(200);
  });

  test('POST /api/decisions requires decisions.manage', async () => {
    const restricted = roleToken({ id: 1401, role: 'External Partner' });
    const res = await request(app)
      .post('/api/decisions')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ description: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates a decision with action items, which become real Task rows', async () => {
    const res = await request(app)
      .post('/api/decisions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Approved secondary rig contingency',
        decisionMakers: 'Executive Committee',
        actionItems: [{ title: 'Notify rig contractor' }],
      });
    expect(res.status).toBe(201);
    decisionId = res.body.id;

    const relatedTasks = await Task.findAll({ where: { relatedType: 'Decision', relatedId: decisionId } });
    expect(relatedTasks.length).toBe(1);
    expect(relatedTasks[0].title).toBe('Notify rig contractor');
  });
});
