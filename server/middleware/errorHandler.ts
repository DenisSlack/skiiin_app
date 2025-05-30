import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../errors/AppError';
import { notifications } from '../lib/notifications';
import { metrics } from '../lib/metrics';
import logger from '../logger';

export const errorHandler = async (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Явный вывод ошибки в консоль
  console.error('!!! ERROR HANDLER:', error, error.stack);

  // Логируем все ошибки
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Увеличиваем счетчик ошибок
  metrics.errorsTotal.inc({ type: error.name, route: req.path });

  // Обработка ошибок валидации Zod
  if (error instanceof ZodError) {
    const validationError = new ValidationError(error.errors);
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Ошибка валидации',
      errors: validationError.errors,
    });
  }

  // Обработка кастомных ошибок приложения
  if (error instanceof AppError) {
    // Отправляем уведомление для критических ошибок
    if (error.statusCode >= 500) {
      await notifications.sendApiErrorNotification(error, req.path).catch((err) => {
        logger.error('Failed to send error notification:', err);
      });
    }

    return res.status(error.statusCode).json({
      status: 'error',
      code: error.code,
      message: error.message,
    });
  }

  // Отправляем уведомление для необработанных ошибок
  await notifications.sendApiErrorNotification(error, req.path).catch((err) => {
    logger.error('Failed to send error notification:', err);
  });

  // Обработка неизвестных ошибок
  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Внутренняя ошибка сервера',
  });
}; 