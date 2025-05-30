import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../errors/AppError';
import { supabase } from '../lib/supabase';
import { metrics } from '../lib/metrics';
import logger from '../logger';
import { User } from '@supabase/supabase-js';

// Расширяем тип Request для добавления информации о пользователе
declare global {
  namespace Express {
    interface Request {
      user?: User & {
        role?: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      metrics.authAttempts.inc({ status: 'no_token' });
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      metrics.authAttempts.inc({ status: 'invalid_token' });
      throw new AuthenticationError('Invalid token');
    }

    metrics.authAttempts.inc({ status: 'success' });
    req.user = {
      ...user,
      role: user.user_metadata.role || 'user',
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    metrics.errorsTotal.inc({ type: 'auth', route: req.path });
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        metrics.authAttempts.inc({ status: 'no_user' });
        throw new AuthenticationError('User not authenticated');
      }

      if (!req.user.role || !roles.includes(req.user.role)) {
        metrics.authAttempts.inc({ status: 'unauthorized' });
        throw new AuthorizationError('Insufficient permissions');
      }

      metrics.authAttempts.inc({ status: 'authorized' });
      next();
    } catch (error) {
      logger.error('Role check error:', error);
      metrics.errorsTotal.inc({ type: 'role_check', route: req.path });
      next(error);
    }
  };
}; 