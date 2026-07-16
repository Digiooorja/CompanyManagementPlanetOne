const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const Block = require('../models/Block');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Document = require('../models/Document');
const Contract = require('../models/Contract');
const { roleToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

// Regression coverage for a reported bug: "search bar on the top of all
// pages is not working. It should search the entered item in whole db and
// display the search related page and link." Root cause: the top-header
// search bar only ever dispatched a `globalSearch` DOM event that a handful
// of pages optionally listened to and used to filter their OWN already-
// loaded list - it never actually queried the backend, so searching from
// most pages (e.g. the Dashboard) did nothing at all. Fixed by adding a real
// GET /api/search endpoint plus a results dropdown in Layout.tsx.
const UNIQUE = `SearchProbe${Date.now()}`;

let owner;
let confidentialDoc;

beforeAll(async () => {
  await Block.create({ name: `${UNIQUE} Block`, description: 'x', status: 'Active' });
  const project = await Project.create({ name: `${UNIQUE} Project`, description: 'x', status: 'Active' });
  await Activity.create({ name: `${UNIQUE} Activity`, projectId: project.id });
  await Contract.create({ title: `${UNIQUE} Contract`, counterparty: 'Acme', status: 'Active' });

  owner = await makeUser({ role: 'Legal/Compliance Officer' });
  await Document.create({ title: `${UNIQUE} Public Doc`, content: 'x', author: 'Test', confidentialityLevel: 'Public' });
  confidentialDoc = await Document.create({
    title: `${UNIQUE} Confidential Doc`,
    content: 'x',
    author: 'Test',
    ownerId: owner.id,
    confidentialityLevel: 'Confidential',
    allowedRoles: []
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/search - global search bar (fixed 2026-07-10)', () => {
  test('a query under 2 characters returns no results (avoids scanning on every keystroke)', async () => {
    const res = await request(app).get('/api/search').query({ q: 'a' });
    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  test('finds matches across multiple modules and returns a usable link for each', async () => {
    const res = await request(app).get('/api/search').query({ q: UNIQUE });
    expect(res.status).toBe(200);

    const types = res.body.results.map((r) => r.type);
    expect(types).toEqual(expect.arrayContaining(['Block', 'Project', 'Activity', 'Contract', 'Document']));

    const blockResult = res.body.results.find((r) => r.type === 'Block');
    expect(blockResult.link).toMatch(/^\/blocks\/\d+$/);
    expect(blockResult.title).toBe(`${UNIQUE} Block`);

    const projectResult = res.body.results.find((r) => r.type === 'Project');
    expect(projectResult.link).toMatch(/^\/projects\/\d+$/);

    const activityResult = res.body.results.find((r) => r.type === 'Activity');
    expect(activityResult.link).toMatch(/^\/activities\/\d+$/);

    const contractResult = res.body.results.find((r) => r.type === 'Contract');
    expect(contractResult.link).toMatch(/^\/contracts\?q=/);
  });

  test('a guest (no auth) does not see a Confidential document in results', async () => {
    const res = await request(app).get('/api/search').query({ q: UNIQUE });
    expect(res.status).toBe(200);
    const titles = res.body.results.map((r) => r.title);
    expect(titles).toContain(`${UNIQUE} Public Doc`);
    expect(titles).not.toContain(`${UNIQUE} Confidential Doc`);
  });

  test('the document owner does see their own Confidential document in results', async () => {
    const token = roleToken({ id: owner.id, role: 'Legal/Compliance Officer' });
    const res = await request(app).get('/api/search').query({ q: UNIQUE }).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const titles = res.body.results.map((r) => r.title);
    expect(titles).toContain(`${UNIQUE} Confidential Doc`);
  });

  test('a random authenticated user without access still does not see the Confidential document', async () => {
    const randomUser = await makeUser({ role: 'Team Member/Staff' });
    const token = roleToken({ id: randomUser.id, role: 'Team Member/Staff' });
    const res = await request(app).get('/api/search').query({ q: UNIQUE }).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const titles = res.body.results.map((r) => r.title);
    expect(titles).not.toContain(`${UNIQUE} Confidential Doc`);
  });

  test('a query with no matches returns an empty results array, not an error', async () => {
    const res = await request(app).get('/api/search').query({ q: 'ZZZ_no_such_thing_ZZZ' });
    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });
});
