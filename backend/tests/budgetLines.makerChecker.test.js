const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Block = require('../models/Block');
const { adminToken, roleToken } = require('./helpers/auth');
const { seedRolePermissions } = require('./helpers/seedRole');
const { makeUser } = require('./helpers/seedUser');

let block;
let maker;
let checker;

beforeAll(async () => {
  await seedRolePermissions('Manager', ['budget.manage']);
  block = await Block.create({ name: 'Test Block', description: 'Fixture block for budget line tests' });
  maker = await makeUser({ role: 'Manager' });
  checker = await makeUser({ role: 'Manager' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Budget Lines — maker-checker revision workflow (§5.6)', () => {
  let lineId;

  test('creates a budget line with an initial approved budget', async () => {
    const res = await request(app)
      .post('/api/budget-lines')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ blockId: block.id, description: 'Drilling programme', approvedBudget: 100000, currency: 'USD' });

    expect(res.status).toBe(201);
    expect(Number(res.body.approvedBudget)).toBe(100000);
    lineId = res.body.id;
  });

  test('rejects a direct PUT attempt to change approvedBudget', async () => {
    const res = await request(app)
      .put(`/api/budget-lines/${lineId}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ approvedBudget: 999999 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/request-revision/);
  });

  test('maker requests a revision', async () => {
    const makerToken = roleToken({ id: maker.id, role: 'Manager' });
    const res = await request(app)
      .post(`/api/budget-lines/${lineId}/request-revision`)
      .set('Authorization', `Bearer ${makerToken}`)
      .send({ proposedApprovedBudget: 150000, comment: 'Scope increase' });

    expect(res.status).toBe(200);
    expect(res.body.revisionStatus).toBe('PendingApproval');
    expect(Number(res.body.pendingApprovedBudget)).toBe(150000);
  });

  test('the same maker cannot approve their own revision (separation of duties)', async () => {
    const makerToken = roleToken({ id: maker.id, role: 'Manager' });
    const res = await request(app)
      .post(`/api/budget-lines/${lineId}/approve-revision`)
      .set('Authorization', `Bearer ${makerToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/maker-checker/);
  });

  test('a different Manager (checker) can approve the revision, updating approvedBudget', async () => {
    const checkerToken = roleToken({ id: checker.id, role: 'Manager' });
    const res = await request(app)
      .post(`/api/budget-lines/${lineId}/approve-revision`)
      .set('Authorization', `Bearer ${checkerToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.revisionStatus).toBe('Approved');
    expect(Number(res.body.approvedBudget)).toBe(150000);
    expect(res.body.pendingApprovedBudget).toBeNull();
  });

  test('rejecting a revision leaves approvedBudget unchanged', async () => {
    const makerToken = roleToken({ id: maker.id, role: 'Manager' });
    await request(app)
      .post(`/api/budget-lines/${lineId}/request-revision`)
      .set('Authorization', `Bearer ${makerToken}`)
      .send({ proposedApprovedBudget: 500000 });

    const checkerToken = roleToken({ id: checker.id, role: 'Manager' });
    const res = await request(app)
      .post(`/api/budget-lines/${lineId}/reject-revision`)
      .set('Authorization', `Bearer ${checkerToken}`)
      .send({ comment: 'Not justified' });

    expect(res.status).toBe(200);
    expect(res.body.revisionStatus).toBe('Rejected');
    expect(Number(res.body.approvedBudget)).toBe(150000); // unchanged from the prior approval
  });
});
