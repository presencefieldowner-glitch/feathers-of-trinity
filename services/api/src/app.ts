import cors from "cors";
import express, { type Express } from "express";
import type { PrismaClient } from "./generated/prisma/index.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";

export function createApp(prisma: PrismaClient): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/auth", createAuthRouter(prisma));

  return app;
}
