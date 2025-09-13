import * as admin from "firebase-admin";
import express from "express";
import { corsMiddleware } from "./middlewares/cors";
import { errorMiddleware } from "./middlewares/error";
import { healthRouter } from "./routes/health";
import { usersRouter } from "./routes/users";
import { postsRouter } from "./routes/posts";
// import { verifyAuth } from "./middlewares/auth"; // if you want protected routes

// Initialize Admin once
try { admin.app(); } catch { admin.initializeApp(); }

export function createApp() {
  const app = express();

  // Core middlewares
  app.use(corsMiddleware);
  app.use(express.json());

  // Routes (versioned)
  app.use("/v1/health", healthRouter);
  app.use("/v1/users", usersRouter); // app.use("/v1/users", verifyAuth, usersRouter) to protect
  app.use("/v1/posts", postsRouter);

  // Fallback / error
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
  app.use(errorMiddleware);

  return app;
}
