import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import logger from './logger';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: undefined,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = resolve(__dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = await vite.transformIndexHtml(url, template);

      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
      const appHtml = await render(url);
      const html = template.replace(`<!--app-html-->`, appHtml);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      logger.error('Error during SSR:', e);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = resolve(__dirname, "../dist/public");
  app.use(express.static(distPath, { index: false }));

  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(
        resolve(distPath, "index.html"),
        "utf-8"
      );
      // SSR отключён в production, просто отдаём index.html
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e: any) {
      logger.error('Error serving static files:', e);
      next(e);
    }
  });
}
