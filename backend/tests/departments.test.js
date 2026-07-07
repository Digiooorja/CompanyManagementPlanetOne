const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');

afterAll(async () => {
  await sequelize.close();
});

describe('Departments (open/reference data - no RBAC gate on this route)', () => {
  test('GET /api/departments works without auth', async () => {
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/departments creates a new department (findOrCreate)', async () => {
    const res = await request(app)
      .post('/api/departments')
      .send({ name: 'Test Department', description: 'Fixture' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Department');
  });

  test('POST /api/departments with an existing name returns the existing row (idempotent)', async () => {
    const res = await request(app)
      .post('/api/departments')
      .send({ name: 'Test Department', description: 'Different description this time' });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Fixture'); // unchanged - findOrCreate doesn't overwrite
  });

  test('POST /api/departments without a name is rejected', async () => {
    const res = await request(app).post('/api/departments').send({});
    expect(res.status).toBe(400);
  });
});
