import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log, serveStatic } from "./static";
import { errorReportingEnabled, reportFault } from "./lib/glitchtip";
import { ntfyEnabled, BURST_THRESHOLD, BURST_WINDOW_MINUTES } from "./lib/ntfy";

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

// Alerting is entirely optional and env-gated (issue #61): a deploy with
// none of it configured must work unchanged. Log the state once at startup
// so a misconfigured or forgotten env var is visible in `docker logs`
// straight away, rather than only being noticed the first time it matters.
function logAlertingStatus() {
  log(
    errorReportingEnabled
      ? 'Error reporting is ENABLED (SENTRY_DSN set): GitHub API failures and unexpected exceptions will be sent to GlitchTip.'
      : 'Error reporting is DISABLED (SENTRY_DSN not set). Faults will only appear in these logs.',
  );

  log(
    ntfyEnabled
      ? `ntfy alerting is ENABLED (NTFY_URL set): a burst alert fires above ${BURST_THRESHOLD} accepted reports per ${BURST_WINDOW_MINUTES}m, and GitHub API failures alert at most once/hour.`
      : 'ntfy alerting is DISABLED (NTFY_URL not set). Volume bursts and GitHub failures will only appear in these logs.',
  );
}

const app = express();

// The app sits behind Cloudflare then Caddy. Caddy has no trusted_proxies
// configured, so (since Caddy 2.5) it strips the incoming X-Forwarded-For
// and forwards only its own peer address, the CF edge. Trusting one hop
// therefore resolves req.ip to the CF edge, which is the best XFF can do
// here; do NOT raise this to 2 expecting the real client, and do not trust
// hop-counted XFF for anything security relevant. The rate limiter derives
// the real visitor address from CF-Connecting-IP instead (see
// routes/issues.ts).
app.set('trust proxy', 1);

// Don't advertise the framework.
app.disable('x-powered-by');

app.use(express.json({ limit: '10mb' })); // screenshots need more than the 100kb default
app.use(express.urlencoded({ extended: false }));

// Production only: Vite's dev middleware injects inline scripts (the
// react-refresh preamble) that script-src 'self' would block, which breaks
// the app in a real browser during development. The production build has
// no inline scripts, so the strict policy applies there.
if (app.get('env') !== 'development') {
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    }
    next();
  });
}

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
  logAlertingStatus();

  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    // Log the full error server-side; never forward internal error detail
    // (stack traces, upstream API URLs, rate-limit info) to the client.
    console.error(`[error] ${req.method} ${req.path} -> ${status}`, err);

    // Best-effort, never fatal: an unhandled exception on any route is a
    // genuine fault worth having in GlitchTip. This is telemetry, not a
    // gate, so a reporting failure must never affect the response below.
    if (status >= 500) {
      void reportFault({ event: 'unexpected-exception', error: err, tags: { path: req.path, method: req.method } });
    }

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
