const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Project = require('../models/Project');
const { adminToken, roleToken } = require('./helpers/auth');

const admin = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Audit Log (§5.4, Admin-only, immutable)', () => {
  test('rejects a non-Admin entirely', async () => {
    const managerToken = roleToken({ id: 3401, role: 'Manager' });
    const res = await request(app).get('/api/audit').set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  test('mutations to other models are automatically captured in the audit log', async () => {
    const project = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Audit Trail Test Project', description: 'x' });
    expect(project.status).toBe(201);

    const auditRes = await request(app)
      .get(`/api/audit?entityType=Project&entityId=${project.body.id}`)
      .set('Authorization', `Bearer ${admin}`);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.some((log) => log.action === 'CREATE')).toBe(true);
  });
});
