import "dotenv/config";
import { createServer } from "node:http";
import { RuntimeKernel } from "@domain-node-platform/runtime-kernel";
import { createApp } from "./app.js";
import { createAuthPlatformModule } from "./authPlatformModule.js";
import { prisma } from "./db/client.js";

const port = Number(process.env.PORT ?? 4000);
const httpServer = createServer(createApp(prisma));

const kernel = new RuntimeKernel();
kernel.register(createAuthPlatformModule({ prisma, httpServer, port }));

kernel.events.on("module:started", ({ name }) => {
  console.log(`[${name}] listening on port ${port}`);
});

await kernel.init();
await kernel.start();

process.on("SIGTERM", async () => {
  await kernel.stop();
});
