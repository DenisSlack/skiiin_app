import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    adminSession?: {
      isAuthenticated: boolean;
      username: string;
    } | null;
  }
} 