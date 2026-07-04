import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/modules/auth/password.js";

describe("password hashing", () => {
  it("produces a hash different from the plaintext", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash).not.toBe("correct-horse-battery-staple");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("correct-horse-battery-staple", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password against a hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const [hashA, hashB] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);
    expect(hashA).not.toBe(hashB);
  });
});
