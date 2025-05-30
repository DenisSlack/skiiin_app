import { Request, Response, NextFunction } from 'express';
import { cache } from '../lib/cache';
import { metrics } from '../lib/metrics';
import logger from '../logger';

export const cacheMiddleware = (ttl: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Кэшируем только GET запросы
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    const route = req.path;

    try {
      const cachedData = await cache.get(key);
      if (cachedData) {
        logger.debug('Cache hit:', { key });
        metrics.cacheHits.inc({ route });
        return res.json(cachedData);
      }

      metrics.cacheMisses.inc({ route });

      // Сохраняем оригинальный метод json
      const originalJson = res.json;

      // Переопределяем метод json для кэширования ответа
      res.json = function (body: any) {
        cache.set(key, body, ttl).catch((error) => {
          logger.error('Cache set error in middleware:', { key, error });
          metrics.errorsTotal.inc({ type: 'cache_set', route });
        });
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', { key, error });
      metrics.errorsTotal.inc({ type: 'cache_middleware', route });
      next();
    }
  };
}; 