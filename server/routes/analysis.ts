import { Router } from 'express';
import { scanSchema, ingredientsSchema } from '../schemas/analysis';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { cache } from '../lib/cache';

const router = Router();

// Все роуты требуют аутентификации
router.use(requireAuth);

// Анализ изображения
router.post('/scan', validate(scanSchema), async (req, res) => {
  // ... существующий код ...
});

// Анализ текста ингредиентов
router.post('/ingredients', validate(ingredientsSchema), async (req, res) => {
  // ... существующий код ...
});

// Получение истории анализов
router.get('/history', cacheMiddleware(300), async (req, res) => {
  // ... существующий код ...
});

// Получение деталей анализа
router.get('/:id', cacheMiddleware(300), async (req, res) => {
  // ... существующий код ...
});

// Удаление анализа
router.delete('/:id', async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш истории и конкретного анализа
  await cache.invalidatePattern('cache:/api/analysis/history');
  await cache.invalidatePattern(`cache:/api/analysis/${req.params.id}`);
});

export default router; 