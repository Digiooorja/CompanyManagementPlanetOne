const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Projects', () => {
  let projectId;

  test('GET /api/projects works without auth', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
  });

  test('POST /api/projects requires projects.manage', async () => {
    const restricted = roleToken({ id: 601, role: 'External Partner' });
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ name: 'Should Fail', description: 'x' });
    expect(res.status).toBe(403);
  });

  test('creates a project with a clamped completion value, then updates and deletes it', async () => {
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project CRUD', description: 'Fixture', status: 'Planning', completion: 150 });
    expect(createRes.status).toBe(201);
    expect(createRes.body.completion).toBe(100); // clamped to 100
    projectId = createRes.body.id;

    const putRes = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'In Progress' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('In Progress');

    const deleteRes = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
