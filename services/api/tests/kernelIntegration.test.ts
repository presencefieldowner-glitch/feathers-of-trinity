import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { RuntimeKernel } from "@domain-node-platform/runtime-kernel";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createAuthPlatformModule } from "../src/authPlatformModule.js";
import type { PrismaClient } from "../src/generated/prisma/index.js";
import { createTestPrisma, resetDb } from "./testPrisma.js";

let prisma: PrismaClient | undefined;

afterEach(async () => {
  await prisma?.$disconnect();
  prisma = undefined;
});

describe("RuntimeKernel driving the Authentication module", () => {
  it("brings the API up on start() and tears it down on stop()", async () => {
    prisma = createTestPrisma();
    await resetDb(prisma);

    const httpServer = createServer(createApp(prisma));
    const kernel = new RuntimeKernel();
    kernel.register(createAuthPlatformModule({ prisma, httpServer, port: 0 }));

    expect(kernel.getState("auth-api")).toBe("registered");

    await kernel.init();
    expect(kernel.getState("auth-api")).toBe("initialized");

    await kernel.start();
    expect(kernel.getState("auth-api")).toBe("started");

    const { port } = httpServer.address() as AddressInfo;
    const healthRes = await fetch(`http://localhost:${port}/health`);
    expect(healthRes.status).toBe(200);

    await kernel.stop();
    expect(kernel.getState("auth-api")).toBe("stopped");
    expect(httpServer.listening).toBe(false);

    await expect(fetch(`http://localhost:${port}/health`)).rejects.toThrow();
  });

  it("emits module lifecycle events as the kernel drives the module", async () => {
    prisma = createTestPrisma();
    await resetDb(prisma);

    const httpServer = createServer(createApp(prisma));
    const kernel = new RuntimeKernel();
    kernel.register(createAuthPlatformModule({ prisma, httpServer, port: 0 }));

    const seen: string[] = [];
    kernel.events.on("module:initialized", ({ name }) => seen.push(`${name}:initialized`));
    kernel.events.on("module:started", ({ name }) => seen.push(`${name}:started`));
    kernel.events.on("module:stopped", ({ name }) => seen.push(`${name}:stopped`));

    await kernel.init();
    await kernel.start();
    await kernel.stop();

    expect(seen).toEqual(["auth-api:initialized", "auth-api:started", "auth-api:stopped"]);
  });
});
