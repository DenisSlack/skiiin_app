import type { Request, Response, NextFunction } from 'express';
import type { Session } from 'express-session';
import { storage } from '../storage';

interface SessionWithUserId extends Session {
  userId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
  isAuthenticated?: () => boolean;
  session: SessionWithUserId;
  headers: Request['headers'];
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Session in auth middleware:", req.session);
    
    // Check for temporary token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [userId] = decoded.split(':');
        if (userId) {
          const user = await storage.getUser(userId);
          if (user) {
            (req as any).user = user;
            return next();
          }
        }
      } catch (tokenError) {
        console.log("Invalid token format");
      }
    }
    
    // Check session-based authentication
    if ((req.session as any)?.userId) {
      console.log("Found userId in session:", (req.session as any).userId);
      const user = await storage.getUser((req.session as any).userId);
      if (user) {
        (req as any).user = user;
        return next();
      }
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const isAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}; 