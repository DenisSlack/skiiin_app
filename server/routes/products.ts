import { Router } from 'express';
import { productSchema, productUpdateSchema, productQuerySchema } from '../schemas/product';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { cache } from '../lib/cache';
import { container } from '../di/container';

const router = Router();
const { productService } = container;

// Все роуты требуют аутентификации
router.use(requireAuth);

// Получение списка продуктов доступно всем авторизованным пользователям
router.get('/', validate(productQuerySchema), cacheMiddleware(300), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const products = await productService.getUserProducts(userId);
  res.json(products);
});

// Получение информации о продукте доступно всем авторизованным пользователям
router.get('/:id', cacheMiddleware(300), async (req, res) => {
  const productId = parseInt(req.params.id);
  const product = await productService.getProductById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Продукт не найден' });
  }
  res.json(product);
});

// Создание, обновление и удаление продуктов доступно только администраторам
router.post('/', requireRole(['admin']), validate(productSchema), async (req, res) => {
  const product = await productService.createProduct(req.body);
  await cache.invalidatePattern('cache:/api/products*');
  res.status(201).json(product);
});

router.put('/:id', requireRole(['admin']), validate(productUpdateSchema), async (req, res) => {
  // Здесь можно реализовать обновление через productService.updateProduct
  await cache.invalidatePattern(`cache:/api/products/${req.params.id}`);
  await cache.invalidatePattern('cache:/api/products*');
  res.status(501).json({ message: 'Обновление продукта не реализовано' });
});

router.delete('/:id', requireRole(['admin']), async (req, res) => {
  const productId = parseInt(req.params.id);
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  await productService.deleteProduct(productId, userId);
  await cache.invalidatePattern(`cache:/api/products/${req.params.id}`);
  await cache.invalidatePattern('cache:/api/products*');
  res.json({ message: 'Продукт удалён' });
});

export default router; 