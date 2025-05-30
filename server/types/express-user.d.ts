import 'express-serve-static-core';

declare global {
  namespace Express {
    interface User {
      id: string;
      [key: string]: any;
    }
  }
} 