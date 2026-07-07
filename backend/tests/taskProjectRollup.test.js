const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
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

describe('Task -> Project completion roll-up, direct project tasks (§5.3)', () => {
  let project;
  let taskAId;
  let taskBId;

  beforeAll(async () => {
    project = await Project.create({ name: 'Rollup Test Project (tasks)', description: 'Fixture project', completion: 0 });
  });

  test('creating a task linked directly to the project sets completion to its progress', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Direct project task', relatedType: 'Project', relatedId: project.id });
    expect(res.status).toBe(201);
    taskAId = res.body.id;

    await request(app)
      .put(`/api/tasks/${taskAId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 40 });

    await project.reload();
    expect(project.completion).toBe(40);
  });

  test('a second direct project task averages into the same project completion', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Second direct project task', relatedType: 'Project', relatedId: project.id });
    expect(res.status).toBe(201);
    taskBId = res.body.id;

    await request(app)
      .put(`/api/tasks/${taskBId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 80 });

    await project.reload();
    expect(project.completion).toBe(60); // average of 40 and 80
  });

  test('deleting all tasks leaves the last computed completion untouched (no reset to 0)', async () => {
    // Deleting task A first leaves only task B (progress 80) -> recalculates
    // to 80. Deleting task B next leaves zero tasks/activities -> recalc
    // short-circuits and the field is left exactly as it was (80).
    await request(app).delete(`/api/tasks/${taskAId}`).set('Authorization', `Bearer ${token}`);
    await project.reload();
    expect(project.completion).toBe(80);

    await request(app).delete(`/api/tasks/${taskBId}`).set('Authorization', `Bearer ${token}`);
    await project.reload();
    expect(project.completion).toBe(80);
  });
});

describe('Activity -> Project completion roll-up (§5.3, fixed 2026-07-07)', () => {
  // Regression coverage for the reported bug: Project.completion never
  // reflected real progress on the Projects table / Executive Dashboard
  // because only directly-linked Tasks fed the roll-up, but real-world
  // projects track progress via Activities (Tasks are frequently left
  // unlinked, relatedType 'General').
  let project;
  let activityAId;
  let activityBId;

  beforeAll(async () => {
    project = await Project.create({ name: 'Rollup Test Project (activities)', description: 'Fixture project', completion: 0 });
  });

  test('creating a top-level activity with progress sets project completion to match', async () => {
    const res = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Activity A', projectId: project.id, progress: 30 });
    expect(res.status).toBe(201);
    activityAId = res.body.id;

    await project.reload();
    expect(project.completion).toBe(30);
  });

  test('a second top-level activity averages into project completion', async () => {
    const res = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Activity B', projectId: project.id, progress: 70 });
    expect(res.status).toBe(201);
    activityBId = res.body.id;

    await project.reload();
    expect(project.completion).toBe(50); // average of 30 and 70
  });

  test('updating an activity progress recalculates project completion', async () => {
    await request(app)
      .put(`/api/activities/${activityAId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 90 });

    await project.reload();
    expect(project.completion).toBe(80); // average of 90 and 70
  });

  test('deleting an activity recalculates project completion to the remaining one', async () => {
    await request(app).delete(`/api/activities/${activityBId}`).set('Authorization', `Bearer ${token}`);

    await project.reload();
    expect(project.completion).toBe(90); // only Activity A (90) remains
  });
});

describe('Mixed Activities + direct Tasks pool together (§5.3)', () => {
  let project;

  beforeAll(async () => {
    project = await Project.create({ name: 'Rollup Test Project (mixed)', description: 'Fixture project', completion: 0 });
  });

  test('a top-level activity and a directly-linked task are averaged together', async () => {
    await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mixed Activity', projectId: project.id, progress: 20 });

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Mixed direct task', relatedType: 'Project', relatedId: project.id });
    await request(app)
      .put(`/api/tasks/${taskRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progress: 60 });

    await project.reload();
    expect(project.completion).toBe(40); // average of 20 and 60
  });
});

describe('Project completion roll-up is weighted by planned duration (§5.3, added 2026-07-07)', () => {
  // Business rule: "if plan duration for one activity is high, the
  // weightage should be high in completion percentage" — a longer-planned
  // activity should pull the average further than a short-planned one,
  // rather than every item counting equally regardless of how long it runs.
  let project;

  beforeAll(async () => {
    project = await Project.create({ name: 'Rollup Test Project (weighted)', description: 'Fixture project', completion: 0 });
  });

  test('a long-duration activity outweighs a short-duration one in the average', async () => {
    // Activity A: 1-day plan, progress 0% -> weight 1
    await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Short 1-day activity',
        projectId: project.id,
        progress: 0,
        plannedStartDate: '2026-01-01',
        plannedEndDate: '2026-01-02'
      });

    // Activity B: ~100-day plan, progress 100% -> weight ~100
    await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Long 100-day activity',
        projectId: project.id,
        progress: 100,
        plannedStartDate: '2026-01-01',
        plannedEndDate: '2026-04-11' // 100 days later
      });

    await project.reload();
    // Plain (unweighted) average would be 50. Duration-weighted average
    // should be pulled heavily toward the 100%-complete, long-duration item.
    expect(project.completion).toBeGreaterThan(90);
  });

  test('items with no planned dates fall back to a minimum weight of 1 day', async () => {
    const project2 = await Project.create({ name: 'Rollup Test Project (no dates)', description: 'Fixture project', completion: 0 });

    await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No-date activity A', projectId: project2.id, progress: 20 });

    await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No-date activity B', projectId: project2.id, progress: 80 });

    await project2.reload();
    // Both items default to weight 1 -> behaves like a plain average.
    expect(project2.completion).toBe(50);
  });
});

