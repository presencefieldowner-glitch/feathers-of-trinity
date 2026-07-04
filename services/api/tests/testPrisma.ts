import { PrismaClient } from "../src/generated/prisma/index.js";
import { TEST_DATABASE_URL } from "./testDbConfig.js";

export function createTestPrisma(): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
}

export async function resetDb(prisma: PrismaClient): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}
