import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../modules/auth/jwt.js";

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; email: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    req.auth = { userId: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
