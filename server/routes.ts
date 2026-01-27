import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // All data operations are handled client-side via Firebase SDK
  // Backend is currently minimal and serves the application
  return httpServer;
}
