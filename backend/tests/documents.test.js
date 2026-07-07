const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Document = require('../models/Document');
const { roleToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

// Note: POST /api/documents performs a real S3 upload (multer + aws-sdk), so
// it's intentionally not exercised here (no AWS credentials in the test
// environment, and we don't want automated tests hitting a real bucket).
// Fixtures are created directly via the model instead, to test the
// confidentiality access-control logic (§5.5), which is the real business
// rule worth covering.

let owner;
let confidentialDoc;
let publicDoc;

beforeAll(async () => {
  owner = await makeUser({ role: 'Legal/Compliance Officer' });
  confidentialDoc = await Document.create({
    title: 'Confidential Doc',
    content: 'x',
    author: 'Test',
    ownerId: owner.id,
    confidentialityLevel: 'Confidential',
    allowedRoles: ['Finance/Accounts'],
  });
  publicDoc = await Document.create({ title: 'Public Doc', content: 'x', author: 'Test', confidentialityLevel: 'Public' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Documents (§5.5) - confidentiality access control', () => {
  test('GET /api/documents (list) works without auth and only shows visible docs', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(200);
    const titles = res.body.map((d) => d.title);
    expect(titles).toContain('Public Doc');
    expect(titles).not.toContain('Confidential Doc'); // no auth -> not visible
  });

  test('a random authenticated user without the allowed role cannot view the confidential document', async () => {
    const randomUser = await makeUser({ role: 'Team Member/Staff' });
    const token = roleToken({ id: randomUser.id, role: 'Team Member/Staff' });
    const res = await request(app).get(`/api/documents/${confidentialDoc.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('a user in the allowedRoles list can view the confidential document', async () => {
    const financeUser = await makeUser({ role: 'Finance/Accounts' });
    const token = roleToken({ id: financeUser.id, role: 'Finance/Accounts' });
    const res = await request(app).get(`/api/documents/${confidentialDoc.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('the document owner can always view their own confidential document', async () => {
    const token = roleToken({ id: owner.id, role: 'Legal/Compliance Officer' });
    const res = await request(app).get(`/api/documents/${confidentialDoc.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('Admin can always view any confidential document', async () => {
    const admin = await makeUser({ role: 'Admin' });
    const token = roleToken({ id: admin.id, role: 'Admin' });
    const res = await request(app).get(`/api/documents/${confidentialDoc.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('only the owner or Admin may delete a document', async () => {
    const otherUser = await makeUser({ role: 'Manager' });
    const otherToken = roleToken({ id: otherUser.id, role: 'Manager' });
    const forbidden = await request(app).delete(`/api/documents/${publicDoc.id}`).set('Authorization', `Bearer ${otherToken}`);
    expect(forbidden.status).toBe(403);
  });
});

describe('Documents - activityTags de-duplication (fixed 2026-07-07)', () => {
  // Regression coverage for a reported bug: "whenever tagging an activity ...
  // with a document, it is repeating the name." Root cause: both
  // GET /api/documents and GET /api/documents/:id built `activityTags` by
  // unconditionally prepending `document.activityId` onto `document.activityIds`
  // without checking whether it was already in there - and the frontend
  // (Documents.tsx upload form / DocumentDetail.tsx edit form) always saves
  // activityId as activityIds[0], so the primary tagged activity's name was
  // always duplicated whenever any activity was tagged at all.
  const Activity = require('../models/Activity');
  let activity;
  let taggedDoc;

  beforeAll(async () => {
    activity = await Activity.create({ name: 'Tagging Repro Activity' });
    taggedDoc = await Document.create({
      title: 'Tagged Doc',
      content: 'x',
      author: 'Test',
      confidentialityLevel: 'Public',
      activityId: activity.id,
      activityIds: [activity.id]
    });
  });

  test('GET /api/documents (list) does not duplicate the primary tagged activity name', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(200);
    const doc = res.body.find((d) => d.id === taggedDoc.id);
    expect(doc.activityTags).toEqual(['Tagging Repro Activity']);
  });

  test('GET /api/documents/:id does not duplicate the primary tagged activity name', async () => {
    const res = await request(app).get(`/api/documents/${taggedDoc.id}`);
    expect(res.status).toBe(200);
    expect(res.body.activityTags).toEqual(['Tagging Repro Activity']);
  });

  test('a second distinct tagged activity still shows both names once each', async () => {
    const secondActivity = await Activity.create({ name: 'Second Repro Activity' });
    const multiTaggedDoc = await Document.create({
      title: 'Multi Tagged Doc',
      content: 'x',
      author: 'Test',
      confidentialityLevel: 'Public',
      activityId: activity.id,
      activityIds: [activity.id, secondActivity.id]
    });

    const res = await request(app).get(`/api/documents/${multiTaggedDoc.id}`);
    expect(res.status).toBe(200);
    expect(res.body.activityTags).toEqual(['Tagging Repro Activity', 'Second Repro Activity']);
  });
});

