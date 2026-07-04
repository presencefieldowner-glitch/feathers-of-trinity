import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { PrismaClient } from "../src/generated/prisma/index.js";
import { createRealtimeServer, type RealtimeServer } from "../src/realtime/socket.js";
import { createTestPrisma, resetDb } from "./testPrisma.js";

let prisma: PrismaClient;
let httpServer: HttpServer;
let realtime: RealtimeServer;
let baseUrl: string;
let client: ClientSocket | undefined;

beforeEach(async () => {
  prisma = createTestPrisma();
  await resetDb(prisma);

  const app = createApp(prisma);
  httpServer = createServer(app);
  realtime = createRealtimeServer(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;
});

afterEach(async () => {
  client?.disconnect();
  client = undefined;
  realtime.close();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await prisma.$disconnect();
});

async function registerUser(email: string, password: string) {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json() as Promise<{ token: string; user: { id: string } }>;
}

function connectSocket(token: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, { auth: { token } });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

describe("realtime session sync", () => {
  it("broadcasts a session:sync event when a new session is created for the same user", async () => {
    const { token } = await registerUser("realtime@example.com", "hunter2hunter");
    client = await connectSocket(token);

    const syncEvent = new Promise((resolve) => {
      client!.once("session:sync", resolve);
    });

    await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "realtime@example.com", password: "hunter2hunter" }),
    });

    const event = (await syncEvent) as { type: string; email: string };
    expect(event.type).toBe("created");
    expect(event.email).toBe("realtime@example.com");
  });

  it("rejects a socket connection without a valid token", async () => {
    await expect(
      new Promise((resolve, reject) => {
        const socket = ioClient(baseUrl, { auth: { token: "garbage" } });
        socket.on("connect", () => resolve(socket));
        socket.on("connect_error", (err) => reject(err));
      }),
    ).rejects.toBeInstanceOf(Error);
  });

  it("broadcasts a session:sync revoke event when a session is revoked", async () => {
    const registerRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "revoke@example.com", password: "hunter2hunter" }),
    });
    const { token, session } = (await registerRes.json()) as {
      token: string;
      session: { id: string };
    };

    client = await connectSocket(token);

    const syncEvent = new Promise((resolve) => {
      client!.once("session:sync", resolve);
    });

    await fetch(`${baseUrl}/auth/sessions/${session.id}/revoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const event = (await syncEvent) as { type: string; sessionId: string };
    expect(event.type).toBe("revoked");
    expect(event.sessionId).toBe(session.id);
  });
});
