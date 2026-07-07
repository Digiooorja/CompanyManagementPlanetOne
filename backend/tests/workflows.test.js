const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Workflows', () => {
  let workflowId;

  test('GET /api/workflows works without auth', async () => {
    const res = await request(app).get('/api/workflows');
    expect(res.status).toBe(200);
  });

  test('POST /api/workflows requires workflows.manage', async () => {
    const restricted = roleToken({ id: 1001, role: 'External Partner' });
    const res = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ title: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates, updates and deletes a workflow', async () => {
    const createRes = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'AFE Approval Test Workflow', type: 'AFE Approval', status: 'Awaiting Action' });
    expect(createRes.status).toBe(201);
    workflowId = createRes.body.id;

    const putRes = await request(app)
      .put(`/api/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Approved' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('Approved');

    const deleteRes = await request(app)
      .delete(`/api/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
