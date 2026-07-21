import { describe, expect, it } from "vitest";
import { Router, UnmatchedRouteError } from "../src/router.js";

describe("Router", () => {
  it("dispatches to the handler matching method and path", async () => {
    const router = new Router<{ id: string }, string>();
    router.register("GET", "/users/:id", (req) => `user-${req.id}`);

    const result = await router.dispatch("get", "/users/:id", { id: "42" });

    expect(result).toBe("user-42");
  });

  it("throws UnmatchedRouteError when no route matches", async () => {
    const router = new Router();

    await expect(router.dispatch("GET", "/missing", undefined)).rejects.toThrow(
      UnmatchedRouteError,
    );
  });
});
