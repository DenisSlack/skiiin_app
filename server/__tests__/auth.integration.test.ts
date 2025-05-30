import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

let app: express.Express;

beforeAll(async () => {
  app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));
  await registerRoutes(app);
});

describe('Auth Integration', () => {
  const validUser = {
    username: 'testuser_' + Date.now(),
    password: 'Test1234A',
    email: `test_${Date.now()}@example.com`,
    firstName: 'Тест',
    lastName: 'Пользователь',
  };

  it('should not register with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'not-an-email' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should not register with weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should register with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('user');
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'WrongPass123' });
    expect([400, 401]).toContain(res.statusCode);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(validUser.email);
  });

  it('should not access protected endpoint without auth', async () => {
    const res = await request(app).get('/api/products');
    expect([401, 403]).toContain(res.statusCode);
  });
}); 