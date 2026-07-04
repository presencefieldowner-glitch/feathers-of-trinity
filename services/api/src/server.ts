import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { prisma } from "./db/client.js";
import { createRealtimeServer } from "./realtime/socket.js";

const app = createApp(prisma);
const httpServer = createServer(app);
const realtime = createRealtimeServer(httpServer);

process.on("SIGTERM", () => {
  realtime.close();
  httpServer.close();
});

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
