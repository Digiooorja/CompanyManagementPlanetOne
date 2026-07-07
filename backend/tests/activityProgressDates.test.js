const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { adminToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

let token;
let project;

beforeAll(async () => {
  const admin = await makeUser({ role: 'Admin' });
  token = adminToken({ id: admin.id });
  project = await Project.create({ name: 'Progress Dates Test Project', description: 'Fixture', completion: 0 });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Activity progress -> actualStartDate/actualEndDate/status automation', () => {
  let activityId;

  test('creating an activity at 0% progress leaves actualStartDate unset', async () => {
    const res = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Progress Rule Activity', projectId: project.id, progress: 0 });
    expect(res.status).toBe(201);
    expect(res.body.actualStartDate).toBeFalsy();
    activityId = res.body.id;
  });

  test('moving progress from 0 to >0 stamps actualStartDate', async () => {
    const res = await request(app)
      .put(`/api/activities/${activityId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 35 });

    expect(res.status).toBe(200);
    expect(res.body.actualStartDate).toBeTruthy();
    expect(res.body.status).not.toBe('Completed');
  });

  test('an explicit actualStartDate supplied by the user is not overwritten', async () => {
    const res = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Explicit Start Activity', projectId: project.id, progress: 10, actualStartDate: '2026-01-01' });
    expect(res.status).toBe(201);
    expect(new Date(res.body.actualStartDate).toISOString().slice(0, 10)).toBe('2026-01-01');
  });

  test('progress reaching 100 marks status Completed and stamps actualEndDate', async () => {
    const res = await request(app)
      .put(`/api/activities/${activityId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 100, status: 'Active' }); // even if caller tries to force a different status

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Completed');
    expect(res.body.actualEndDate).toBeTruthy();
  });

  test('sub-activity progress reaching 100 also stamps the auto-rolled-up parent when it too reaches 100', async () => {
    const parentRes = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Parent Activity', projectId: project.id, progress: 0 });
    const parentId = parentRes.body.id;

    const childRes = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Only Child Activity', projectId: project.id, parentActivityId: parentId, progress: 0 });
    const childId = childRes.body.id;

    await request(app)
      .put(`/api/activities/${childId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 100 });

    const parent = await Activity.findByPk(parentId);
    expect(parent.progress).toBe(100); // weighted average of its single 100% child
    expect(parent.status).toBe('Completed');
    expect(parent.actualEndDate).toBeTruthy();
    expect(parent.actualStartDate).toBeTruthy();
  });
});
