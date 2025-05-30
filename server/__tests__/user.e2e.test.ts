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

describe('User E2E', () => {
  const user = {
    username: 'e2euser_' + Date.now(),
    password: 'Test1234A',
    email: `e2e_${Date.now()}@example.com`,
    firstName: 'E2E',
    lastName: 'User',
  };
  let cookie: string = '';

  it('should register user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(user);
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('user');
    // Сохраняем cookie сессии
    cookie = res.headers['set-cookie']?.[0]?.split(';')[0] || '';
  });

  it('should login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    // Обновляем cookie сессии
    cookie = res.headers['set-cookie']?.[0]?.split(';')[0] || cookie;
  });

  let productId: number | undefined;

  it('should add product (authorized)', async () => {
    const product = {
      name: 'E2E Test Product',
      ingredients: ['Aqua', 'Glycerin', 'Niacinamide'],
    };
    const res = await request(app)
      .post('/api/products')
      .set('Cookie', cookie)
      .send(product);
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('id');
    productId = res.body.id;
  });

  it('should get user products (authorized)', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Cookie', cookie);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p: any) => p.id === productId)).toBe(true);
  });
}); 