import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import nock from 'nock';

let app: express.Express;

beforeAll(async () => {
  app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));
  await registerRoutes(app);
});

describe('Product Analysis E2E (mocked AI)', () => {
  const user = {
    username: 'mockaiuser_' + Date.now(),
    password: 'Test1234A',
    email: `mockai_${Date.now()}@example.com`,
    firstName: 'Mock',
    lastName: 'AI',
  };
  let cookie: string = '';
  let productId: number | undefined;

  beforeAll(() => {
    // Мокаем внешний AI-запрос (Perplexity)
    nock('https://api.perplexity.ai')
      .post('/chat/completions')
      .reply(200, {
        choices: [
          {
            message: {
              content: JSON.stringify({
                insights: { recommendations: ['Use daily'] },
                ingredients: ['Aqua', 'Glycerin', 'Niacinamide'],
              })
            }
          }
        ]
      });
  });

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
      name: 'Mocked AI Product',
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

  it('should analyze product (mocked AI)', async () => {
    const res = await request(app)
      .post('/api/analysis')
      .set('Cookie', cookie)
      .send({ productId, ingredientList: ['Aqua', 'Glycerin', 'Niacinamide'] });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('analysis');
    expect(res.body.result.ingredients).toContain('Aqua');
    expect(res.body.result.insights.recommendations).toContain('Use daily');
  });
}); 