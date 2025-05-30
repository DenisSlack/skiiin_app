import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Название продукта обязательно').describe('Название продукта'),
  barcode: z.string().optional().describe('Штрихкод продукта (опционально)'),
  ingredients: z.array(z.string()).min(1, 'Должен быть указан хотя бы один ингредиент').describe('Список ингредиентов продукта'),
  image: z.string().optional().describe('Изображение продукта в формате base64 (опционально)'),
}).describe('Схема создания продукта');

export const productUpdateSchema = productSchema.partial().describe('Схема обновления продукта (все поля опциональны)');

export const productQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional().describe('Номер страницы для пагинации'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().describe('Количество элементов на странице'),
  search: z.string().optional().describe('Поисковый запрос по названию продукта'),
}).describe('Схема параметров запроса списка продуктов');

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>; 