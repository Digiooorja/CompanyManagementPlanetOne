const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');

afterAll(async () => {
  await sequelize.close();
});

describe('API smoke tests', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /api/blocks works without auth (guest read access)', async () => {
    const res = await request(app).get('/api/blocks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('unknown route returns 404', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
  });
});
