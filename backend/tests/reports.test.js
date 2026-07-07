const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

let admin;

beforeAll(async () => {
  const adminUser = await makeUser({ role: 'Admin' });
  admin = adminToken({ id: adminUser.id });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Reports catalogue (§ reports.manage)', () => {
  test('GET /api/reports/definitions works without auth', async () => {
    const res = await request(app).get('/api/reports/definitions');
    expect(res.status).toBe(200);
  });

  test('POST /api/reports/definitions requires reports.manage', async () => {
    const restricted = roleToken({ id: 3101, role: 'External Partner' });
    const res = await request(app)
      .post('/api/reports/definitions')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ name: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('Admin creates a report definition', async () => {
    const res = await request(app)
      .post('/api/reports/definitions')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Test Monthly Report', category: 'Operations', frequency: 'Monthly' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Monthly Report');
  });

  test('generic report log requires authentication, then create succeeds', async () => {
    const noToken = await request(app).post('/api/reports').send({ title: 'Generated Report', type: 'Portfolio' });
    expect(noToken.status).toBe(401);

    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'Generated Report', type: 'Project', content: 'Summary of Q2 2026 portfolio performance.' });
    expect(res.status).toBe(201);
  });
});
