const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Activity = require('../models/Activity');
const Department = require('../models/Department');
const { adminToken, roleToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

let token;
let activity;
let department;
let author;

beforeAll(async () => {
  const admin = await makeUser({ role: 'Admin' });
  token = adminToken({ id: admin.id });
  author = admin;
  activity = await Activity.create({ name: 'Comment Fixture Activity' });
  department = await Department.create({ name: 'Comments Test Department' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Comments', () => {
  let commentId;

  test('GET /api/comments works without auth', async () => {
    const res = await request(app).get('/api/comments');
    expect(res.status).toBe(200);
  });

  test('POST /api/comments requires comments.manage', async () => {
    const restricted = roleToken({ id: 801, role: 'External Partner' });
    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${restricted}`)
      .send({ content: 'Should fail', activityId: activity.id, departmentId: department.id });
    expect(res.status).toBe(403);
  });

  test('creates a comment on an activity, then only the author can edit/delete it', async () => {
    const createRes = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Flow test rates look good', activityId: activity.id, departmentId: department.id });
    expect(createRes.status).toBe(201);
    commentId = createRes.body.id;

    const otherUser = await makeUser({ role: 'Manager' });
    const otherToken = roleToken({ id: otherUser.id, role: 'Manager' });
    const forbiddenEdit = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'Trying to edit someone else\'s comment' });
    expect(forbiddenEdit.status).toBe(403);

    const ownEdit = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated by the author' });
    expect(ownEdit.status).toBe(200);
    expect(ownEdit.body.content).toBe('Updated by the author');
  });
});
