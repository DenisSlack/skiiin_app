import 'dotenv/config';
import express from "express";
import { registerRoutes } from "./routes";
import cors from 'cors';
import path from "path";
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 5000;

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cors());
app.use(cookieParser());

// Trust proxy for session
app.set("trust proxy", 1);

// Basic CSP for OCR libraries
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data: 'wasm-unsafe-eval'; " +
    "worker-src 'self' blob: data:; " +
    "connect-src 'self' https://api.perplexity.ai https://generativelanguage.googleapis.com blob: data:; " +
    "img-src 'self' data: blob: https:; " +
    "style-src 'self' 'unsafe-inline';"
  );
  next();
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'client/dist')));
}

// Start server
(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Serve static files for SPA
    app.get('*', (req, res) => {
      if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(process.cwd(), 'client/dist/index.html'));
      } else {
        res.status(404).send('Development server - use Vite');
      }
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();