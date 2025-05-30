import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { cache } from '../lib/cache';

const router = Router();

// Все роуты требуют аутентификации
router.use(requireAuth);

// Получение профиля текущего пользователя
router.get('/me', cacheMiddleware(300), async (req, res) => {
  // ... существующий код ...
});

// Получение списка пользователей (только для админов)
router.get('/', requireRole(['admin']), cacheMiddleware(300), async (req, res) => {
  // ... существующий код ...
});

// Получение информации о пользователе (только для админов)
router.get('/:id', requireRole(['admin']), cacheMiddleware(300), async (req, res) => {
  // ... существующий код ...
});

// Обновление профиля
router.put('/me', async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш профиля
  await cache.invalidatePattern('cache:/api/users/me');
});

// Обновление пользователя (только для админов)
router.put('/:id', requireRole(['admin']), async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш конкретного пользователя и списка
  await cache.invalidatePattern(`cache:/api/users/${req.params.id}`);
  await cache.invalidatePattern('cache:/api/users*');
});

// Удаление пользователя (только для админов)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  // ... существующий код ...
  // Инвалидируем кэш конкретного пользователя и списка
  await cache.invalidatePattern(`cache:/api/users/${req.params.id}`);
  await cache.invalidatePattern('cache:/api/users*');
});

export default router; 