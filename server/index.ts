import path from "path";
import { fileURLToPath } from "url";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app: Express = express();

// Apply middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(cookieParser());

const server: Server = createServer(app);

async function main() {
  try {
    // Register all routes including auth
    await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ message: 'Internal server error' });
    });

    // Serve static files
    const distPath = path.resolve(__dirname, '../dist/public');
    app.use(express.static(distPath));
    
    // SPA fallback for React Router
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    // Start server
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
