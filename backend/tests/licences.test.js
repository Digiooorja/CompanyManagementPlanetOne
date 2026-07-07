const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Block = require('../models/Block');
const { adminToken, roleToken } = require('./helpers/auth');

let token;
let block;

beforeAll(async () => {
  token = adminToken();
  block = await Block.create({ name: 'Licence Fixture Block', description: 'Fixture' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Licences', () => {
  let licenceId;

  test('GET /api/licences works without auth', async () => {
    const res = await request(app).get('/api/licences');
    expect(res.status).toBe(200);
  });

  test('POST /api/licences requires licences.manage (RBAC matrix, not the old managerMiddleware check)', async () => {
    const restricted = roleToken({ id: 1601, role: 'External Partner' });
    const res = await request(app)
      .post('/api/licences')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ licenceNumber: 'SHOULD-FAIL' });
    expect(res.status).toBe(403);
  });

  test('creates a licence linked to a block, enriched with the block name', async () => {
    const res = await request(app)
      .post('/api/licences')
      .set('Authorization', `Bearer ${token}`)
      .send({ licenceNumber: 'PC-EXP-TEST-01', licenceType: 'Exploration', blockIds: [block.id] });
    expect(res.status).toBe(201);
    expect(res.body.blockNames).toContain('Licence Fixture Block');
    licenceId = res.body.id;
  });

  test('updates and deletes the licence', async () => {
    const putRes = await request(app)
      .put(`/api/licences/${licenceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Suspended' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('Suspended');

    const deleteRes = await request(app)
      .delete(`/api/licences/${licenceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
