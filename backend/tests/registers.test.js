const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Registers', () => {
  let registerId;

  test('GET /api/registers works without auth', async () => {
    const res = await request(app).get('/api/registers');
    expect(res.status).toBe(200);
  });

  test('POST /api/registers requires registers.manage', async () => {
    const restricted = roleToken({ id: 701, role: 'External Partner' });
    const res = await request(app)
      .post('/api/registers')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ name: 'Should Fail', type: 'risk', value: {} });
    expect(res.status).toBe(403);
  });

  test('creates and reads back a register', async () => {
    const res = await request(app)
      .post('/api/registers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Register', type: 'vendor', value: { vendors: ['Acme Corp'] } });
    expect(res.status).toBe(201);
    registerId = res.body.id;

    const getRes = await request(app).get(`/api/registers/${registerId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('Test Register');
  });
});
