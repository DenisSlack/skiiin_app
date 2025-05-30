import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../logger';

export const validate = (schema: AnyZodObject) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await schema.parseAsync(req.body);
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Validation error:', {
        errors: error.errors,
        path: req.path,
        method: req.method,
      });
      
      return res.status(400).json({
        message: 'Ошибка валидации',
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    
    logger.error('Unexpected validation error:', error);
    return res.status(500).json({
      message: 'Внутренняя ошибка сервера при валидации',
    });
  }
}; 