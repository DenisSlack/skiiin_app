import promClient from 'prom-client';
import expressPromBundle from 'express-prom-bundle';

// Создаем регистр метрик
const register = new promClient.Registry();

// Добавляем стандартные метрики Node.js
promClient.collectDefaultMetrics({ register });

// Создаем кастомные метрики
export const metrics = {
  // Метрики запросов к AI
  aiRequestsTotal: new promClient.Counter({
    name: 'ai_requests_total',
    help: 'Total number of AI requests',
    labelNames: ['status'],
    registers: [register],
  }),

  aiRequestDuration: new promClient.Histogram({
    name: 'ai_request_duration_seconds',
    help: 'Duration of AI requests in seconds',
    labelNames: ['status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [register],
  }),

  // Метрики кэша
  cacheHits: new promClient.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['route'],
    registers: [register],
  }),

  cacheMisses: new promClient.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['route'],
    registers: [register],
  }),

  // Метрики аутентификации
  authAttempts: new promClient.Counter({
    name: 'auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['status'],
    registers: [register],
  }),

  // Метрики ошибок
  errorsTotal: new promClient.Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'route'],
    registers: [register],
  }),
};

// Конфигурация middleware для сбора метрик
export const metricsMiddleware = expressPromBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    application: 'ingredient-analyzer',
  },
  promRegistry: register,
  metricsPath: '/metrics',
});

export { register }; 