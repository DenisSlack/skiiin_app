import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { cache } from '../lib/cache';

const router = Router();

// Все роуты требуют аутентификации
router.use(requireAuth);

// Получение списка ингредиентов
router.get('/', cacheMiddleware(3600), async (req, res) => {
  // ... существующий код ...
});

// Получение информации об ингредиенте
router.get('/:id', cacheMiddleware(3600), async (req, res) => {
  // ... существующий код ...
});

// Создание ингредиента (только для админов)
router.post('/', requireRole(['admin']), async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш списка ингредиентов
  await cache.invalidatePattern('cache:/api/ingredients*');
});

// Обновление ингредиента (только для админов)
router.put('/:id', requireRole(['admin']), async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш конкретного ингредиента и списка
  await cache.invalidatePattern(`cache:/api/ingredients/${req.params.id}`);
  await cache.invalidatePattern('cache:/api/ingredients*');
});

// Удаление ингредиента (только для админов)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш конкретного ингредиента и списка
  await cache.invalidatePattern(`cache:/api/ingredients/${req.params.id}`);
  await cache.invalidatePattern('cache:/api/ingredients*');
});

export default router; 