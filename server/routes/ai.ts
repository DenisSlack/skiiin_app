import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { cache } from '../lib/cache';

const router = Router();

// Все роуты требуют аутентификации
router.use(requireAuth);

// Получение истории запросов к AI
router.get('/history', cacheMiddleware(300), async (req, res) => {
  // ... существующий код ...
});

// Получение деталей запроса к AI
router.get('/:id', cacheMiddleware(300), async (req, res) => {
  // ... существующий код ...
});

// Создание запроса к AI
router.post('/', async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш истории
  await cache.invalidatePattern('cache:/api/ai/history');
});

// Удаление запроса к AI
router.delete('/:id', async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш истории и конкретного запроса
  await cache.invalidatePattern('cache:/api/ai/history');
  await cache.invalidatePattern(`cache:/api/ai/${req.params.id}`);
});

export default router; 