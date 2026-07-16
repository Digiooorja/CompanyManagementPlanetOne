const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Block = require('../models/Block');
const { adminToken, roleToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

let token;
let block;

beforeAll(async () => {
  token = adminToken();
  block = await Block.create({ name: 'Licence Fixture Block', description: 'Fixture' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Licences', () => {
  let licenceId;

  test('GET /api/licences works without auth', async () => {
    const res = await request(app).get('/api/licences');
    expect(res.status).toBe(200);
  });

  test('POST /api/licences requires licences.manage (RBAC matrix, not the old managerMiddleware check)', async () => {
    const restricted = roleToken({ id: 1601, role: 'External Partner' });
    const res = await request(app)
      .post('/api/licences')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ licenceNumber: 'SHOULD-FAIL' });
    expect(res.status).toBe(403);
  });

  test('creates a licence linked to a block, enriched with the block name', async () => {
    const res = await request(app)
      .post('/api/licences')
      .set('Authorization', `Bearer ${token}`)
      .send({ licenceNumber: 'PC-EXP-TEST-01', licenceType: 'Exploration', blockIds: [block.id] });
    expect(res.status).toBe(201);
    expect(res.body.blockNames).toContain('Licence Fixture Block');
    licenceId = res.body.id;
  });

  test('updates and deletes the licence', async () => {
    const putRes = await request(app)
      .put(`/api/licences/${licenceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Suspended' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.status).toBe('Suspended');

    const deleteRes = await request(app)
      .delete(`/api/licences/${licenceId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(deleteRes.status);
  });
});

describe('Licences - Phase Countdown (§5.9, added 2026-07-10)', () => {
  let adminUser;
  let phaseToken;
  let licenceId;

  beforeAll(async () => {
    adminUser = await makeUser({ role: 'Admin' });
    phaseToken = adminToken({ id: adminUser.id });
  });

  test('an initial phase can be set directly on creation (no sign-off needed)', async () => {
    const res = await request(app)
      .post('/api/licences')
      .set('Authorization', `Bearer ${phaseToken}`)
      .send({
        licenceNumber: 'PC-PHASE-TEST-01',
        licenceType: 'Exploration',
        phase: 'Exploration',
        phaseStartDate: '2026-01-01',
        phaseEndDate: '2026-12-31',
        minWorkObligation: '2 exploration wells, 500km 2D seismic'
      });
    expect(res.status).toBe(201);
    expect(res.body.phase).toBe('Exploration');
    expect(res.body.minWorkObligation).toBe('2 exploration wells, 500km 2D seismic');
    licenceId = res.body.id;
  });

  test('a plain PUT rejects a direct phase change and points to the transition endpoint', async () => {
    const res = await request(app)
      .put(`/api/licences/${licenceId}`)
      .set('Authorization', `Bearer ${phaseToken}`)
      .send({ phase: 'Appraisal' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/transition-phase/);
  });

  test('a plain PUT still allows editing other fields (including phase dates) without changing phase', async () => {
    const res = await request(app)
      .put(`/api/licences/${licenceId}`)
      .set('Authorization', `Bearer ${phaseToken}`)
      .send({ phaseEndDate: '2027-01-15' });
    expect(res.status).toBe(200);
    expect(new Date(res.body.phaseEndDate).toISOString().slice(0, 10)).toBe('2027-01-15');
    expect(res.body.phase).toBe('Exploration');
  });

  test('POST /:id/transition-phase requires confirmed=true', async () => {
    const res = await request(app)
      .post(`/api/licences/${licenceId}/transition-phase`)
      .set('Authorization', `Bearer ${phaseToken}`)
      .send({ newPhase: 'Appraisal', comment: 'Moving to appraisal' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/confirmed/);
  });

  test('POST /:id/transition-phase requires a sign-off comment', async () => {
    const res = await request(app)
      .post(`/api/licences/${licenceId}/transition-phase`)
      .set('Authorization', `Bearer ${phaseToken}`)
      .send({ newPhase: 'Appraisal', confirmed: true });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/comment/i);
  });

  test('POST /:id/transition-phase rejects an invalid phase value', async () => {
    const res = await request(app)
      .post(`/api/licences/${licenceId}/transition-phase`)
      .set('Authorization', `Bearer ${phaseToken}`)
      .send({ newPhase: 'NotARealPhase', confirmed: true, comment: 'test' });
    expect(res.status).toBe(400);
  });

  test('a fully valid transition succeeds and records the audited sign-off', async () => {
    const res = await request(app)
      .post(`/api/licences/${licenceId}/transition-phase`)
      .set('Authorization', `Bearer ${phaseToken}`)
      .send({
        newPhase: 'Appraisal',
        phaseStartDate: '2027-01-16',
        phaseEndDate: '2028-01-15',
        minWorkObligation: '1 appraisal well',
        confirmed: true,
        comment: 'Exploration commitments met; regulator approved appraisal phase entry.'
      });
    expect(res.status).toBe(200);
    expect(res.body.phase).toBe('Appraisal');
    expect(res.body.minWorkObligation).toBe('1 appraisal well');
    expect(res.body.phaseTransitionedById).toBe(adminUser.id);
    expect(res.body.phaseTransitionComment).toMatch(/regulator approved/i);
    expect(res.body.phaseTransitionedAt).toBeTruthy();
  });

  test('non-Admin without licences.manage cannot transition a phase', async () => {
    const restrictedToken = roleToken({ id: adminUser.id, role: 'External Partner' });
    const res = await request(app)
      .post(`/api/licences/${licenceId}/transition-phase`)
      .set('Authorization', `Bearer ${restrictedToken}`)
      .send({ newPhase: 'Development', confirmed: true, comment: 'test' });
    expect(res.status).toBe(403);
  });
});
