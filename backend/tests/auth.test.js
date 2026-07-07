const request = require('supertest');
const app = require('../app');
const sequelize = require('../database');

afterAll(async () => {
  await sequelize.close();
});

describe('Auth (register/login)', () => {
  const email = 'authtest@example.com';
  const password = 'Sup3rSecret!';

  test('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'authtestuser', email, password, firstName: 'Auth', lastName: 'Test' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });

  test('rejects registering the same email twice', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'authtestuser2', email, password, firstName: 'Auth', lastName: 'Test' });
    expect(res.status).toBe(400);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('rejects login with the wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('rejects login for a non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever' });
    expect(res.status).toBe(401);
  });
});
