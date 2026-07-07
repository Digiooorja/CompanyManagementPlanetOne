const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

let token;

beforeAll(async () => {
  const admin = await makeUser({ role: 'Admin' });
  token = adminToken({ id: admin.id });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Finance / AFE tracking (§5.10)', () => {
  let afeId;

  test('creates an AFE record', async () => {
    const res = await request(app)
      .post('/api/finance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        item: 'FPSO Turret Bearing Replacement',
        amount: 8000000,
        category: 'Maintenance',
        type: 'Expense',
        recordType: 'AFE',
      });

    expect(res.status).toBe(201);
    expect(res.body.recordType).toBe('AFE');
    afeId = res.body.id;
  });

  test('rejects closure without reconciliationConfirmed', async () => {
    const res = await request(app)
      .post(`/api/finance/${afeId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reconciliationConfirmed/);
  });

  test('rejects a direct PUT attempting to set status to Closed', async () => {
    const res = await request(app)
      .put(`/api/finance/${afeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Closed' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/POST \/:id\/close/);
  });

  test('creates a supplementary AFE chained via parentAfeId', async () => {
    const res = await request(app)
      .post(`/api/finance/${afeId}/create-supplement`)
      .set('Authorization', `Bearer ${token}`)
      .send({ additionalAmount: 500000 });

    expect(res.status).toBe(201);
    expect(res.body.parentAfeId).toBe(afeId);
    expect(res.body.supplementNumber).toBe(1);
    expect(Number(res.body.amount)).toBe(500000);
  });

  test('closes the AFE with reconciliation sign-off', async () => {
    const res = await request(app)
      .post(`/api/finance/${afeId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reconciliationConfirmed: true, comment: 'Reconciled against final invoices' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Closed');
    expect(res.body.reconciledById).not.toBeNull();
  });

  test('cannot close the same AFE twice', async () => {
    const res = await request(app)
      .post(`/api/finance/${afeId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reconciliationConfirmed: true });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already closed/);
  });
});
