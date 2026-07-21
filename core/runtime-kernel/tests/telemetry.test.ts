import { describe, expect, it } from "vitest";
import { Telemetry } from "../src/telemetry.js";

describe("Telemetry", () => {
  it("accumulates counters across increments", () => {
    const telemetry = new Telemetry();
    telemetry.increment("requests");
    telemetry.increment("requests", 4);

    expect(telemetry.get("requests")).toBe(5);
  });

  it("overwrites gauges rather than accumulating them", () => {
    const telemetry = new Telemetry();
    telemetry.gauge("queue-depth", 3);
    telemetry.gauge("queue-depth", 7);

    expect(telemetry.get("queue-depth")).toBe(7);
  });

  it("snapshots all metrics and resets them", () => {
    const telemetry = new Telemetry();
    telemetry.increment("a");
    telemetry.gauge("b", 2);

    expect(telemetry.snapshot()).toEqual({ a: 1, b: 2 });

    telemetry.reset();
    expect(telemetry.snapshot()).toEqual({});
  });
});
