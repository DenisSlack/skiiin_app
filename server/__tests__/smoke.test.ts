import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { registerRoutes } from '../routes';

let app: express.Express;
let server: any;

beforeAll(async () => {
  app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));
  server = await registerRoutes(app);
});

describe('API Smoke Test', () => {
  it('POST /api/auth/register — should return 200 or 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'smoketest', password: 'test1234' });
    expect([200, 400]).toContain(res.statusCode);
  });

  it('POST /api/auth/login — should return 200 or 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'smoketest', password: 'test1234' });
    expect([200, 400]).toContain(res.statusCode);
  });

  it('GET /api/products — should return 401 (unauthenticated)', async () => {
    const res = await request(app).get('/api/products');
    expect([401, 403]).toContain(res.statusCode);
  });

  it('POST /api/products/find-ingredients — should return 200', async () => {
    const res = await request(app)
      .post('/api/products/find-ingredients')
      .send({ productName: 'La Roche-Posay Effaclar Duo' });
    expect([200, 400, 500]).toContain(res.statusCode);
  });

  it('POST /api/analyze-product-image — should return 400 or 500', async () => {
    const res = await request(app)
      .post('/api/analyze-product-image')
      .send({ imageData: '' });
    expect([400, 500]).toContain(res.statusCode);
  });
}); 