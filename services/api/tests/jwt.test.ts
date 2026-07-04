import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "../src/modules/auth/jwt.js";

describe("jwt helpers", () => {
  it("round-trips a payload through sign and verify", () => {
    const token = signToken({ sub: "user-1", email: "a@example.com" });
    const payload = verifyToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.email).toBe("a@example.com");
  });

  it("throws when verifying a tampered token", () => {
    const token = signToken({ sub: "user-1", email: "a@example.com" });
    const tampered = `${token}tampered`;
    expect(() => verifyToken(tampered)).toThrow();
  });

  it("throws when verifying an already-expired token", async () => {
    const originalExpiry = process.env.JWT_EXPIRES_IN;
    process.env.JWT_EXPIRES_IN = "1ms";
    const token = signToken({ sub: "user-1", email: "a@example.com" });
    process.env.JWT_EXPIRES_IN = originalExpiry;

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(() => verifyToken(token)).toThrow();
  });
});
