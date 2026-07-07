const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { adminToken, roleToken } = require('./helpers/auth');
const { seedRolePermissions } = require('./helpers/seedRole');
const { makeUser } = require('./helpers/seedUser');

let maker;
let checker;

beforeAll(async () => {
  await seedRolePermissions('Manager', ['forex.manage']);
  maker = await makeUser({ role: 'Manager' });
  checker = await makeUser({ role: 'Manager' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Forex & Banking Workflow — maker-checker (Phase 2 §7)', () => {
  let txId;

  test('creates a Draft transaction', async () => {
    const res = await request(app)
      .post('/api/forex')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ transactionType: 'Spot', fromCurrency: 'USD', toCurrency: 'GHS', amount: 10000, rate: 12.5 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Draft');
    txId = res.body.id;
  });

  test('cannot settle a Draft transaction', async () => {
    const res = await request(app)
      .post(`/api/forex/${txId}/settle`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('maker submits for approval', async () => {
    const makerToken = roleToken({ id: maker.id, role: 'Manager' });
    const res = await request(app)
      .post(`/api/forex/${txId}/request-approval`)
      .set('Authorization', `Bearer ${makerToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PendingApproval');
  });

  test('the same maker cannot approve their own request', async () => {
    const makerToken = roleToken({ id: maker.id, role: 'Manager' });
    const res = await request(app)
      .post(`/api/forex/${txId}/approve`)
      .set('Authorization', `Bearer ${makerToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  test('a different Manager (checker) approves', async () => {
    const checkerToken = roleToken({ id: checker.id, role: 'Manager' });
    const res = await request(app)
      .post(`/api/forex/${txId}/approve`)
      .set('Authorization', `Bearer ${checkerToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Approved');
  });

  test('settles the approved transaction', async () => {
    const res = await request(app)
      .post(`/api/forex/${txId}/settle`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Settled');
  });
});
