import { Router } from "express";
import { z } from "zod";
import type { PrismaClient } from "../../generated/prisma/index.js";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/requireAuth.js";
import { AuthService } from "./auth.service.js";
import { AuthError } from "./errors.js";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function createAuthRouter(prisma: PrismaClient): Router {
  const router = Router();
  const authService = new AuthService(prisma);

  router.post("/register", async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid email or password", issues: parsed.error.issues });
      return;
    }

    try {
      const result = await authService.register(parsed.data.email, parsed.data.password);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  router.post("/login", async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    try {
      const result = await authService.login(parsed.data.email, parsed.data.password);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = await authService.getUserById(req.auth!.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json({ user });
  });

  router.post("/sessions/:sessionId/revoke", requireAuth, async (req: AuthenticatedRequest, res) => {
    await authService.revokeSession(req.params.sessionId, req.auth!.userId);
    res.status(204).send();
  });

  router.post(
    "/sessions/:sessionId/heartbeat",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      const touched = await authService.touchSession(req.params.sessionId, req.auth!.userId);
      if (!touched) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      res.status(204).send();
    },
  );

  return router;
}
