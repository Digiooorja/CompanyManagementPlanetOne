const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('PC/GNPC Correspondence Log (§5.14)', () => {
  let entryId;

  test('GET /api/correspondence works without auth', async () => {
    const res = await request(app).get('/api/correspondence');
    expect(res.status).toBe(200);
  });

  test('POST /api/correspondence requires correspondence.manage', async () => {
    const restricted = roleToken({ id: 1301, role: 'External Partner' });
    const res = await request(app)
      .post('/api/correspondence')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ subject: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates, searches and updates a correspondence entry', async () => {
    const createRes = await request(app)
      .post('/api/correspondence')
      .set('Authorization', `Bearer ${token}`)
      .send({ direction: 'Inbound', subject: 'Drilling permit query', fromParty: 'Petroleum Commission', awaitingResponse: true });
    expect(createRes.status).toBe(201);
    entryId = createRes.body.id;

    const searchRes = await request(app).get('/api/correspondence?search=drilling permit');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.some((e) => e.id === entryId)).toBe(true);

    const putRes = await request(app)
      .put(`/api/correspondence/${entryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Closed', awaitingResponse: false });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('Closed');
  });
});
