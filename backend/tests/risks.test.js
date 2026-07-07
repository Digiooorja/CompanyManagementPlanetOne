const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Project = require('../models/Project');
const { adminToken, roleToken } = require('./helpers/auth');

let token;
let project;

beforeAll(async () => {
  token = adminToken();
  project = await Project.create({ name: 'Risks Fixture Project', description: 'Fixture' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Risk Register (§5.15)', () => {
  let riskId;

  test('GET /api/risks works without auth', async () => {
    const res = await request(app).get('/api/risks');
    expect(res.status).toBe(200);
  });

  test('POST /api/risks requires risks.manage', async () => {
    const restricted = roleToken({ id: 901, role: 'External Partner' });
    const res = await request(app)
      .post('/api/risks')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ projectId: project.id, title: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates a risk and exposes a computed riskScore/riskBand', async () => {
    const res = await request(app)
      .post('/api/risks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: project.id,
        title: 'Rig availability delay',
        severity: 'High',
        probability: 'High',
        status: 'Active',
      });
    expect(res.status).toBe(201);
    riskId = res.body.id;
    expect(res.body.riskScore).toBeGreaterThan(0);
    expect(['Low', 'Medium', 'High']).toContain(res.body.riskBand);
  });

  test('updates and deletes the risk', async () => {
    const putRes = await request(app)
      .put(`/api/risks/${riskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Mitigated' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('Mitigated');

    const deleteRes = await request(app)
      .delete(`/api/risks/${riskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
