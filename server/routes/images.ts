import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { cache } from '../lib/cache';

const router = Router();

// Все роуты требуют аутентификации
router.use(requireAuth);

// Получение списка изображений
router.get('/', cacheMiddleware(300), async (req, res) => {
  // ... существующий код ...
});

// Получение информации об изображении
router.get('/:id', cacheMiddleware(300), async (req, res) => {
  // ... существующий код ...
});

// Загрузка изображения
router.post('/', async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш списка изображений
  await cache.invalidatePattern('cache:/api/images*');
});

// Удаление изображения
router.delete('/:id', async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш конкретного изображения и списка
  await cache.invalidatePattern(`cache:/api/images/${req.params.id}`);
  await cache.invalidatePattern('cache:/api/images*');
});

export default router; 