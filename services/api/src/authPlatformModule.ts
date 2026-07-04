import type { Server as HttpServer } from "node:http";
import type { PlatformModule } from "@domain-node-platform/runtime-kernel";
import type { PrismaClient } from "./generated/prisma/index.js";
import { createRealtimeServer, type RealtimeServer } from "./realtime/socket.js";

export interface AuthPlatformModuleOptions {
  readonly prisma: PrismaClient;
  readonly httpServer: HttpServer;
  readonly port: number;
}

export function createAuthPlatformModule(options: AuthPlatformModuleOptions): PlatformModule {
  const { prisma, httpServer, port } = options;
  let realtime: RealtimeServer | undefined;

  return {
    name: "auth-api",

    async init() {
      await prisma.$connect();
    },

    async start() {
      realtime = createRealtimeServer(httpServer);
      await new Promise<void>((resolve) => httpServer.listen(port, resolve));
    },

    async stop() {
      realtime?.close();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      await prisma.$disconnect();
    },
  };
}
