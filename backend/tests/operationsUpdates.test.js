const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Block = require('../models/Block');
const { adminToken, roleToken } = require('./helpers/auth');

let token;
let block;

beforeAll(async () => {
  token = adminToken();
  block = await Block.create({ name: 'Ops Update Fixture Block', description: 'Fixture' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Operations Update (§5.12)', () => {
  test('GET /api/operations-updates works without auth', async () => {
    const res = await request(app).get('/api/operations-updates');
    expect(res.status).toBe(200);
  });

  test('POST /api/operations-updates requires operations_updates.manage', async () => {
    const restricted = roleToken({ id: 1501, role: 'External Partner' });
    const res = await request(app)
      .post('/api/operations-updates')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ summary: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates an update and it is returned filtered by blockId', async () => {
    const res = await request(app)
      .post('/api/operations-updates')
      .set('Authorization', `Bearer ${token}`)
      .send({ blockId: block.id, wellName: 'JUB-P3-07', summary: 'Flow testing continuing on schedule' });
    expect(res.status).toBe(201);

    const filtered = await request(app).get(`/api/operations-updates?blockId=${block.id}&limit=3`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.length).toBeGreaterThan(0);
    expect(filtered.body.every((u) => u.blockId === block.id)).toBe(true);
  });
});
