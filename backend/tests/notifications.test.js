const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');
const { roleToken } = require('./helpers/auth');
const { makeUser } = require('./helpers/seedUser');

let userA;
let userB;
let tokenA;
let tokenB;

beforeAll(async () => {
  userA = await makeUser({ role: 'Manager' });
  userB = await makeUser({ role: 'Manager' });
  tokenA = roleToken({ id: userA.id, role: 'Manager' });
  tokenB = roleToken({ id: userB.id, role: 'Manager' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Notifications', () => {
  test('a regular user only sees their own notifications by default', async () => {
    await request(app).post('/api/notifications').set('Authorization', `Bearer ${tokenA}`).send({
      message: 'Alert for user A', userId: userA.id, module: 'Manual',
    });
    await request(app).post('/api/notifications').set('Authorization', `Bearer ${tokenB}`).send({
      message: 'Alert for user B', userId: userB.id, module: 'Manual',
    });

    const resA = await request(app).get('/api/notifications').set('Authorization', `Bearer ${tokenA}`);
    expect(resA.status).toBe(200);
    expect(resA.body.every((n) => n.userId === userA.id)).toBe(true);
  });

  test('POST /api/notifications requires authentication', async () => {
    const res = await request(app).post('/api/notifications').send({ message: 'No token', userId: userA.id });
    expect(res.status).toBe(401);
  });
});
