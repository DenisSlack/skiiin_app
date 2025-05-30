import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
// OpenAPI документация временно отключена

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Базовые middleware
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'", "blob:", "data:", "'wasm-unsafe-eval'"],
      "worker-src": ["'self'", "blob:", "data:"],
      "connect-src": ["'self'", "https://api.perplexity.ai", "https://generativelanguage.googleapis.com", "blob:", "data:"],
      "img-src": ["'self'", "data:", "blob:", "https:"],
      "media-src": ["'self'", "blob:", "data:"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
  xssFilter: true,
  noSniff: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// Дополнительные заголовки безопасности
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors());

// Rate limiting для всех API
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP за 15 минут
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
}));

// Более строгий rate limiting для логина и регистрации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Слишком много попыток входа или регистрации. Попробуйте позже.'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Логирование временно отключено

// Set trust proxy for session cookies to work properly
app.set("trust proxy", 1);

// Configure CSP to allow OCR libraries and WebAssembly
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data: 'wasm-unsafe-eval'; " +
    "worker-src 'self' blob: data:; " +
    "connect-src 'self' https://api.perplexity.ai https://generativelanguage.googleapis.com blob: data:; " +
    "img-src 'self' data: blob: https:; " +
    "media-src 'self' blob: data:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "style-src 'self' 'unsafe-inline';"
  );
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Временно убрали CSRF и метрики
app.use(cookieParser());

(async () => {
  const server = await registerRoutes(app);

  // Простой обработчик ошибок
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`Server started on port ${port}`);
  });
})();
