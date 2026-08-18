import type { Express } from "express";
import { createServer, type Server } from "http";
import issuesRouter from "./routes/issues";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register bug report / issue creation routes
  app.use("/api/issues", issuesRouter);

  const httpServer = createServer(app);

  return httpServer;
}
