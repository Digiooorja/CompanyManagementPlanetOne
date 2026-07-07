const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Document = require('../models/Document');
const { adminToken, roleToken } = require('./helpers/auth');

let token;
let doc;

beforeAll(async () => {
  token = adminToken();
  doc = await Document.create({ title: 'Data Room Doc', content: 'x', author: 'Test' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('NDA & Data Room Tracker (Phase 2 §7)', () => {
  let ndaId;
  let grantId;

  test('GET /api/ndas works without auth', async () => {
    const res = await request(app).get('/api/ndas');
    expect(res.status).toBe(200);
  });

  test('POST /api/ndas requires nda.manage', async () => {
    const restricted = roleToken({ id: 1901, role: 'External Partner' });
    const res = await request(app)
      .post('/api/ndas')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ counterparty: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates an NDA', async () => {
    const res = await request(app)
      .post('/api/ndas')
      .set('Authorization', `Bearer ${token}`)
      .send({ counterparty: 'JV Partner Co', ndaType: 'Mutual' });
    expect(res.status).toBe(201);
    ndaId = res.body.id;
  });

  test('grants data-room access to a document under the NDA', async () => {
    const res = await request(app)
      .post(`/api/ndas/${ndaId}/grants`)
      .set('Authorization', `Bearer ${token}`)
      .send({ documentId: doc.id, accessLevel: 'View' });
    expect(res.status).toBe(201);
    grantId = res.body.id;

    const listRes = await request(app).get(`/api/ndas/${ndaId}/grants`);
    expect(listRes.status).toBe(200);
    expect(listRes.body[0].document.title).toBe('Data Room Doc');
  });

  test('revokes the grant (soft-revoke, sets revokedAt)', async () => {
    const res = await request(app)
      .put(`/api/ndas/${ndaId}/grants/${grantId}/revoke`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.revokedAt).toBeTruthy();
  });
});
