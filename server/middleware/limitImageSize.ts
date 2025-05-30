import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для ограничения размера base64-строки изображения.
 * @param field - имя поля в body (например, imageData или image)
 * @param maxBytes - максимальный размер в байтах (по умолчанию 10 МБ)
 */
export function limitImageSize(field: string, maxBytes = 10 * 1024 * 1024) {
  // base64 увеличивает размер примерно на 33%
  const maxBase64Length = Math.floor(maxBytes * 4 / 3);
  return (req: Request, res: Response, next: NextFunction) => {
    const base64 = req.body[field];
    if (typeof base64 === 'string' && base64.length > maxBase64Length) {
      return res.status(413).json({
        message: `Изображение слишком большое. Максимальный размер — ${maxBytes / (1024 * 1024)} МБ.`
      });
    }
    next();
  };
} 