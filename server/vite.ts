import { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";

// Development-only: this module imports the "vite" package, so it must
// never be imported from a code path that also runs in production. It is
// loaded exclusively via a dynamic import from server/index.ts, gated on
// NODE_ENV === "development", so esbuild's production bundle never pulls
// vite in. Static-file serving and the shared `log` helper live in
// server/static.ts, which both dev and prod use.

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    // Plain logger: the Replit template's custom logger called
    // process.exit(1) on ANY logged error, including errors the browser
    // reports back over HMR, so loading the app in a real browser could
    // kill the whole dev server (found by the Playwright journey).
    customLogger: viteLogger,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes.
      // The template's per-request ?v=<nanoid> cache-bust on the entry
      // script was removed as needless: Vite's dev server manages module
      // caching itself. (It was once suspected of breaking fast refresh;
      // the actual culprit was the CSP blocking Vite's inline preamble,
      // fixed in server/index.ts.)
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
