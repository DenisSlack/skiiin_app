import { Router } from 'express';
import { storage } from '../storage';
import { insertIngredientSchema } from '@shared/schema';

const router = Router();

// Получить ингредиент по имени
router.get('/api/ingredients/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const ingredient = await storage.getIngredient(name);
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ingredient' });
  }
});

// Создать ингредиент
router.post('/api/ingredients', async (req, res) => {
  try {
    const data = insertIngredientSchema.parse(req.body);
    const ingredient = await storage.createIngredient(data);
    res.json(ingredient);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create ingredient' });
  }
});

// Обновить ингредиент
router.put('/api/ingredients/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const data = req.body;
    const updated = await storage.updateIngredient(name, data);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update ingredient' });
  }
});

// Удалить ингредиент
router.delete('/api/ingredients/:name', async (req, res) => {
  try {
    const name = req.params.name;
    await storage.deleteIngredient(name);
    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete ingredient' });
  }
});

export default router; 