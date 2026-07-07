const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Environmental Permit Tracker (Phase 2 §7)', () => {
  let permitId;

  test('GET /api/environmental-permits works without auth', async () => {
    const res = await request(app).get('/api/environmental-permits');
    expect(res.status).toBe(200);
  });

  test('POST /api/environmental-permits requires env_permits.manage', async () => {
    const restricted = roleToken({ id: 1801, role: 'External Partner' });
    const res = await request(app)
      .post('/api/environmental-permits')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ permitNumber: 'SHOULD-FAIL' });
    expect(res.status).toBe(403);
  });

  test('creates, updates and deletes an environmental permit', async () => {
    const createRes = await request(app)
      .post('/api/environmental-permits')
      .set('Authorization', `Bearer ${token}`)
      .send({ permitNumber: 'EPA-TEST-01', permitType: 'EPAPermit' });
    expect(createRes.status).toBe(201);
    permitId = createRes.body.id;

    const putRes = await request(app)
      .put(`/api/environmental-permits/${permitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Suspended' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('Suspended');

    const deleteRes = await request(app)
      .delete(`/api/environmental-permits/${permitId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
