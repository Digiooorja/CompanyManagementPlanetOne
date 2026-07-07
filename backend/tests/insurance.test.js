const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Insurance Register (Phase 2 §7)', () => {
  let policyId;

  test('GET /api/insurance works without auth', async () => {
    const res = await request(app).get('/api/insurance');
    expect(res.status).toBe(200);
  });

  test('POST /api/insurance requires insurance.manage', async () => {
    const restricted = roleToken({ id: 1701, role: 'External Partner' });
    const res = await request(app)
      .post('/api/insurance')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ policyNumber: 'SHOULD-FAIL' });
    expect(res.status).toBe(403);
  });

  test('creates, updates and deletes an insurance policy', async () => {
    const createRes = await request(app)
      .post('/api/insurance')
      .set('Authorization', `Bearer ${token}`)
      .send({ policyNumber: 'POL-TEST-01', insurer: 'Test Insurer', policyType: 'Property', coverageAmount: 500000 });
    expect(createRes.status).toBe(201);
    policyId = createRes.body.id;

    const putRes = await request(app)
      .put(`/api/insurance/${policyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Expired' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('Expired');

    const deleteRes = await request(app)
      .delete(`/api/insurance/${policyId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
