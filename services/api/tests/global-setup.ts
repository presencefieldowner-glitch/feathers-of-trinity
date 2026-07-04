import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TEST_DATABASE_URL, TEST_DB_PATH } from "./testDbConfig.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "..");

function removeTestDbFiles(): void {
  for (const suffix of ["", "-journal"]) {
    const file = `${TEST_DB_PATH}${suffix}`;
    if (fs.existsSync(file)) {
      fs.rmSync(file);
    }
  }
}

export default async function globalSetup(): Promise<() => void> {
  removeTestDbFiles();

  execSync("npx prisma migrate deploy --schema src/db/prisma/schema.prisma", {
    cwd: rootDir,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });

  return () => {
    removeTestDbFiles();
  };
}
