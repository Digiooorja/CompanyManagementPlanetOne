const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

let token;

beforeAll(async () => {
  const admin = await makeUser({ role: 'Admin' });
  token = adminToken({ id: admin.id });
});

afterAll(async () => {
  await sequelize.close();
});

describe('HSE Register (Phase 2 §7)', () => {
  let incidentId;

  test('GET /api/hse/metrics returns TRIR/LTIF fields', async () => {
    const res = await request(app).get('/api/hse/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('trir');
    expect(res.body).toHaveProperty('ltif');
  });

  test('POST /api/hse requires hse.manage', async () => {
    const restricted = roleToken({ id: 2201, role: 'External Partner' });
    const res = await request(app)
      .post('/api/hse')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ description: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates an incident and rejects closing it without rootCause/correctiveAction', async () => {
    const createRes = await request(app)
      .post('/api/hse')
      .set('Authorization', `Bearer ${token}`)
      .send({ incidentType: 'NearMiss', severity: 'Medium', description: 'Dropped tool near wellhead' });
    expect(createRes.status).toBe(201);
    incidentId = createRes.body.id;

    const closeRes = await request(app)
      .post(`/api/hse/${incidentId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(closeRes.status).toBe(400);
  });

  test('closing succeeds once rootCause and correctiveAction are supplied', async () => {
    const res = await request(app)
      .post(`/api/hse/${incidentId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rootCause: 'Inadequate tool tethering', correctiveAction: 'Mandatory tool lanyards introduced' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Closed');
  });

  test('records exposure hours, which feed the metrics roll-up', async () => {
    const res = await request(app)
      .post('/api/hse/exposure-hours')
      .set('Authorization', `Bearer ${token}`)
      .send({ periodLabel: 'Test Period', manHours: 10000 });
    expect(res.status).toBe(201);

    const metrics = await request(app).get('/api/hse/metrics');
    expect(metrics.body.exposureHours).toBeGreaterThanOrEqual(10000);
    expect(metrics.body.exposureSource).toBe('recorded');
  });
});
