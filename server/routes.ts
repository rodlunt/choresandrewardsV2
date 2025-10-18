import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import issuesRouter from "./routes/issues";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Register bug report / issue creation routes
  app.use("/api/issues", issuesRouter);

  const httpServer = createServer(app);

  return httpServer;
}
