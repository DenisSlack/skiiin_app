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

describe('Product Analysis E2E', () => {
  const user = {
    username: 'analysisuser_' + Date.now(),
    password: 'Test1234A',
    email: `analysis_${Date.now()}@example.com`,
    firstName: 'Анализ',
    lastName: 'Пользователь',
  };
  let cookie: string = '';
  let productId: number | undefined;

  it('should register and login user', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send(user);
    expect([200, 201]).toContain(reg.statusCode);
    cookie = reg.headers['set-cookie']?.[0]?.split(';')[0] || '';
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(login.statusCode).toBe(200);
    cookie = login.headers['set-cookie']?.[0]?.split(';')[0] || cookie;
  });

  it('should add product', async () => {
    const product = {
      name: 'AI Test Product',
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

  it('should analyze product', async () => {
    const res = await request(app)
      .post('/api/analysis')
      .set('Cookie', cookie)
      .send({ productId, ingredientList: ['Aqua', 'Glycerin', 'Niacinamide'] });
    expect([200, 503]).toContain(res.statusCode); // 503 если AI временно недоступен
    // Если 200 — должен быть analysis/result
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('analysis');
      expect(res.body).toHaveProperty('result');
    }
  });
}); 