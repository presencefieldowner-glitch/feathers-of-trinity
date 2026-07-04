import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const TEST_DB_PATH = path.resolve(here, "test.db");
export const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;
