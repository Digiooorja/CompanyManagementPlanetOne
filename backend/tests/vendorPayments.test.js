const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');

const token = adminToken();

afterAll(async () => {
  await sequelize.close();
});

describe('Vendor Payment Aging (Phase 2 §7)', () => {
  let invoiceId;

  test('GET /api/vendor-payments works without auth', async () => {
    const res = await request(app).get('/api/vendor-payments');
    expect(res.status).toBe(200);
  });

  test('POST /api/vendor-payments requires vendor_payments.manage', async () => {
    const restricted = roleToken({ id: 2001, role: 'External Partner' });
    const res = await request(app)
      .post('/api/vendor-payments')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ vendor: 'Should Fail' });
    expect(res.status).toBe(403);
  });

  test('creates an overdue invoice and it shows up in the aging summary', async () => {
    const createRes = await request(app)
      .post('/api/vendor-payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ vendor: 'Acme Supplies', amount: 10000, currency: 'USD', dueDate: '2020-01-01', status: 'Open' });
    expect(createRes.status).toBe(201);
    invoiceId = createRes.body.id;
    expect(createRes.body.agingBucket).toBe('90+');

    const summaryRes = await request(app).get('/api/vendor-payments/aging-summary');
    expect(summaryRes.status).toBe(200);
    const bucket = summaryRes.body.find((b) => b.bucket === '90+' && b.currency === 'USD');
    expect(bucket.invoiceCount).toBeGreaterThan(0);
  });

  test('updates and deletes the invoice', async () => {
    const putRes = await request(app)
      .put(`/api/vendor-payments/${invoiceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Paid', amountPaid: 10000 });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('Paid');

    const deleteRes = await request(app)
      .delete(`/api/vendor-payments/${invoiceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});
