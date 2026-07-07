const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Local Content Tracking (Phase 2 §7)', () => {
  test('GET /api/local-content works without auth', async () => {
    const res = await request(app).get('/api/local-content');
    expect(res.status).toBe(200);
  });

  test('POST /api/local-content requires local_content.manage', async () => {
    const restricted = roleToken({ id: 2101, role: 'External Partner' });
    const res = await request(app)
      .post('/api/local-content')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ period: '2026-Q2' });
    expect(res.status).toBe(403);
  });

  test('creates a record with a shortfall and it appears in the summary', async () => {
    const res = await request(app)
      .post('/api/local-content')
      .set('Authorization', `Bearer ${token}`)
      .send({ period: '2026-Q2-TEST', metric: 'LocalSpend', committedPercent: 30, actualPercent: 20 });
    expect(res.status).toBe(201);
    expect(res.body.shortfallPercent).toBe(10);

    const summaryRes = await request(app).get('/api/local-content/summary');
    expect(summaryRes.status).toBe(200);
    const period = summaryRes.body.find((p) => p.period === '2026-Q2-TEST');
    expect(period.shortfallCount).toBe(1);
  });
});
