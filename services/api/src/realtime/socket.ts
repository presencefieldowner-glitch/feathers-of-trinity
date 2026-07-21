import type { Server as HttpServer } from "node:http";
import { Scheduler } from "@domain-node-platform/runtime-kernel";
import { Server, type Socket } from "socket.io";
import type { PrismaClient } from "../generated/prisma/index.js";
import { AuthService } from "../modules/auth/auth.service.js";
import { verifyToken } from "../modules/auth/jwt.js";
import { authEvents, type SessionCreatedEvent, type SessionRevokedEvent } from "./authEvents.js";

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export interface RealtimeServer {
  io: Server;
  close: () => void;
}

export interface RealtimeServerOptions {
  /** How often a connected socket bumps its session's lastSeenAt. */
  readonly heartbeatIntervalMs?: number;
}

/**
 * As long as a socket stays connected, its session is kept continuously
 * "live" -- lastSeenAt is bumped on an interval (via the kernel's
 * Scheduler) rather than only at login/register. The interval is cancelled
 * on disconnect and cancelAll() sweeps any stragglers on server close.
 */
export function createRealtimeServer(
  httpServer: HttpServer,
  prisma: PrismaClient,
  options: RealtimeServerOptions = {},
): RealtimeServer {
  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
  const authService = new AuthService(prisma);
  const scheduler = new Scheduler();

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Missing auth token"));
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      socket.data.sessionId = payload.sid;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    const sessionId = socket.data.sessionId as string;
    socket.join(userRoom(userId));

    void authService.touchSession(sessionId, userId);
    const heartbeat = scheduler.scheduleInterval(() => {
      void authService.touchSession(sessionId, userId);
    }, heartbeatIntervalMs);

    socket.on("disconnect", () => {
      scheduler.cancel(heartbeat);
    });
  });

  const onSessionCreated = (event: SessionCreatedEvent) => {
    io.to(userRoom(event.userId)).emit("session:sync", { type: "created", ...event });
  };

  const onSessionRevoked = (event: SessionRevokedEvent) => {
    io.to(userRoom(event.userId)).emit("session:sync", { type: "revoked", ...event });
  };

  authEvents.on("session:created", onSessionCreated);
  authEvents.on("session:revoked", onSessionRevoked);

  const close = () => {
    scheduler.cancelAll();
    authEvents.off("session:created", onSessionCreated);
    authEvents.off("session:revoked", onSessionRevoked);
    io.close();
  };

  return { io, close };
}
