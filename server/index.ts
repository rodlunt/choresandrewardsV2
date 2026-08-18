import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log, serveStatic } from "./static";

// Content-Security-Policy applied to everything except /api responses (which
// are JSON, not documents a browser renders). 'unsafe-inline' on style-src
// is required by Radix UI and other inline React styles.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
].join('; ');

// Fail loud, not silent: a missing GITHUB_TOKEN otherwise only surfaces the
// first time someone submits a bug report, as a bare 503, well after the
// container has passed its healthcheck and been deployed.
function checkRequiredEnv() {
  if (!process.env.GITHUB_TOKEN) {
    log('='.repeat(72));
    log('WARNING: GITHUB_TOKEN is not set.');
    log('Bug/feature reporting (POST /api/issues/create) is DISABLED and');
    log('will respond 503 to every submission until this is fixed.');
    log('Set GITHUB_TOKEN in the environment and redeploy.');
    log('='.repeat(72));
  }
}

const app = express();

// The app sits behind exactly two proxies: Cloudflare (which appends the
// real client IP to X-Forwarded-For) then Caddy (which appends the CF edge
// address). Trusting two hops makes req.ip, and therefore the rate
// limiter's key, resolve to the client Cloudflare recorded, even when a
// caller sends a forged X-Forwarded-For through Cloudflare. With only one
// hop trusted, req.ip was the CF edge and the limiter pooled unrelated
// users per edge. Known residual: a request that reaches Caddy directly,
// bypassing Cloudflare, can spoof req.ip with a forged header; the only
// thing keyed off req.ip is the rate limiter, so the exposure is limit
// evasion, nothing else.
app.set('trust proxy', 2);

// Don't advertise the framework.
app.disable('x-powered-by');

app.use(express.json({ limit: '10mb' })); // screenshots need more than the 100kb default
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  }
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

      log(logLine);
    }
  });

  next();
});

(async () => {
  checkRequiredEnv();

  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    // Log the full error server-side; never forward internal error detail
    // (stack traces, upstream API URLs, rate-limit info) to the client.
    console.error(`[error] ${req.method} ${req.path} -> ${status}`, err);

    res.status(status).json({ message: "Internal Server Error" });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  //
  // The vite dev middleware is loaded via a dynamic import gated on this
  // branch, and "./vite" is built as an external module (see package.json's
  // build script), so the production bundle never pulls in the vite package.
  if (app.get("env") === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
