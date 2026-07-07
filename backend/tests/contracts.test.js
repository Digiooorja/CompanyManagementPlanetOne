const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Contract Register (§5.11)', () => {
  let contractId;

  test('GET /api/contracts works without auth', async () => {
    const res = await request(app).get('/api/contracts');
    expect(res.status).toBe(200);
  });

  test('POST /api/contracts requires contracts.manage', async () => {
    const restricted = roleToken({ id: 1101, role: 'External Partner' });
    const res = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ title: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates, updates and deletes a contract', async () => {
    const createRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Rig Charter Test', counterparty: 'Atwood Oceanics', contractType: 'Rig', value: 1000000 });
    expect(createRes.status).toBe(201);
    contractId = createRes.body.id;

    const putRes = await request(app)
      .put(`/api/contracts/${contractId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Active' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('Active');

    const deleteRes = await request(app)
      .delete(`/api/contracts/${contractId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
