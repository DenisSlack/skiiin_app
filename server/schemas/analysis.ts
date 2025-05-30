import { z } from 'zod';

export const scanSchema = z.object({
  image: z.string()
    .min(1, 'Изображение обязательно')
    .startsWith('data:image/', 'Должен быть base64-строкой изображения')
    .describe('Изображение продукта в формате base64'),
}).describe('Схема для сканирования изображения продукта');

export const ingredientsSchema = z.object({
  text: z.string().min(1, 'Текст обязателен').describe('Текст для извлечения ингредиентов'),
}).describe('Схема для извлечения ингредиентов из текста');

export type ScanInput = z.infer<typeof scanSchema>;
export type IngredientsInput = z.infer<typeof ingredientsSchema>; 