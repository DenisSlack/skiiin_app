import 'dotenv/config';
import express from "express";
import { registerRoutes } from "./routes";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files from client dist
app.use(express.static(path.join(process.cwd(), 'client/dist')));

// API routes
registerRoutes(app).then((server) => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
});