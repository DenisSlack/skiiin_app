import { Router } from 'express';
import { storage } from '../storage';
import { insertProductSchema } from '@shared/schema';
import { findProductImage } from '../perplexity';

const router = Router();

// Создание продукта
router.post('/api/products', async (req: any, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userId = req.session.userId;
    let imageUrl = '';
    try {
      imageUrl = await findProductImage(req.body.name || '');
    } catch (imageError) {
      console.log('Could not find product image:', imageError);
    }
    const productData = insertProductSchema.parse({
      ...req.body,
      userId,
      imageUrl: imageUrl || null,
    });
    const product = await storage.createProduct(productData);
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create product' });
  }
});

// Получение всех продуктов пользователя
router.get('/api/products', async (req: any, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userId = req.session.userId;
    const products = await storage.getUserProducts(userId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Получение продукта по id
router.get('/api/products/:id', async (req: any, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userId = req.session.userId;
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Удаление продукта
router.delete('/api/products/:id', async (req: any, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userId = req.session.userId;
    const productId = parseInt(req.params.id);
    await storage.deleteProduct(productId, userId);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router; 