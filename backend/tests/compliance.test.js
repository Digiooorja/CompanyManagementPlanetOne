const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Document = require('../models/Document');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();
let evidenceDoc;

beforeAll(async () => {
  evidenceDoc = await Document.create({ title: 'Evidence Doc', content: 'x', author: 'Test' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Compliance & Statutory Payments Tracker (§5.7)', () => {
  let obligationId;

  test('GET /api/compliance works without auth', async () => {
    const res = await request(app).get('/api/compliance');
    expect(res.status).toBe(200);
  });

  test('POST /api/compliance requires compliance.manage', async () => {
    const restricted = roleToken({ id: 1201, role: 'External Partner' });
    const res = await request(app)
      .post('/api/compliance')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ description: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates an overdue obligation, then rejects closing it without evidence', async () => {
    const createRes = await request(app)
      .post('/api/compliance')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Q2 Royalty Payment', dueDate: '2020-01-01', status: 'Pending' });
    expect(createRes.status).toBe(201);
    obligationId = createRes.body.id;

    const closeRes = await request(app)
      .put(`/api/compliance/${obligationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Closed' });
    expect(closeRes.status).toBe(400);
  });

  test('closing succeeds once an evidence document is attached', async () => {
    const res = await request(app)
      .put(`/api/compliance/${obligationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Closed', evidenceDocumentId: evidenceDoc.id });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Closed');
  });
});
