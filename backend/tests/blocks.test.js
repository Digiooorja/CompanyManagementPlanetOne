const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');
const { seedRolePermissions } = require('./helpers/seedRole');

let token;

beforeAll(async () => {
  await seedRolePermissions('External Partner', ['reports.view']);
  token = adminToken();
});

afterAll(async () => {
  await sequelize.close();
});

describe('Blocks (§5, reference data)', () => {
  let blockId;

  test('GET /api/blocks works without auth', async () => {
    const res = await request(app).get('/api/blocks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/blocks requires blocks.manage', async () => {
    const restricted = roleToken({ id: 501, role: 'External Partner' });
    const res = await request(app)
      .post('/api/blocks')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ name: 'Should Fail', description: 'x' });
    expect(res.status).toBe(403);
  });

  test('creates, reads, updates and deletes a block', async () => {
    const createRes = await request(app)
      .post('/api/blocks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Block CRUD', description: 'Fixture', status: 'Active', operator: 'Test Operator' });
    expect(createRes.status).toBe(201);
    blockId = createRes.body.id;

    const getRes = await request(app).get(`/api/blocks/${blockId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('Test Block CRUD');

    const putRes = await request(app)
      .put(`/api/blocks/${blockId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ operator: 'Updated Operator' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.operator).toBe('Updated Operator');

    const deleteRes = await request(app)
      .delete(`/api/blocks/${blockId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
