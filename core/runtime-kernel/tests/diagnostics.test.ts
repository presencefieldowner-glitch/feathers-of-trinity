import { describe, expect, it } from "vitest";
import { Diagnostics } from "../src/diagnostics.js";

describe("Diagnostics", () => {
  it("reports healthy when every check passes", async () => {
    const diagnostics = new Diagnostics();
    diagnostics.register("db", () => true);
    diagnostics.register("cache", async () => true);

    const report = await diagnostics.run();

    expect(report.healthy).toBe(true);
    expect(report.results).toEqual([
      { name: "db", healthy: true },
      { name: "cache", healthy: true },
    ]);
  });

  it("reports unhealthy and captures the error when a check throws", async () => {
    const diagnostics = new Diagnostics();
    diagnostics.register("flaky", () => {
      throw new Error("boom");
    });

    const report = await diagnostics.run();

    expect(report.healthy).toBe(false);
    expect(report.results).toEqual([{ name: "flaky", healthy: false, error: "Error: boom" }]);
  });
});
