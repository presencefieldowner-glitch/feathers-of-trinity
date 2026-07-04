import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { verifyToken } from "../modules/auth/jwt.js";
import { authEvents, type SessionCreatedEvent, type SessionRevokedEvent } from "./authEvents.js";

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export interface RealtimeServer {
  io: Server;
  close: () => void;
}

export function createRealtimeServer(httpServer: HttpServer): RealtimeServer {
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
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(userRoom(userId));
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
    authEvents.off("session:created", onSessionCreated);
    authEvents.off("session:revoked", onSessionRevoked);
    io.close();
  };

  return { io, close };
}
