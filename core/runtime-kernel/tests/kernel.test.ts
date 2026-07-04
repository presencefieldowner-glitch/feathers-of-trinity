import { describe, expect, it, vi } from "vitest";
import { RuntimeKernel } from "../src/kernel.js";
import {
  CyclicDependencyError,
  DuplicateModuleError,
  ModuleLifecycleError,
  UnknownDependencyError,
} from "../src/errors.js";
import type { PlatformModule } from "../src/module.js";

function trackingModule(name: string, calls: string[], overrides: Partial<PlatformModule> = {}): PlatformModule {
  return {
    name,
    init: () => {
      calls.push(`${name}:init`);
    },
    start: () => {
      calls.push(`${name}:start`);
    },
    stop: () => {
      calls.push(`${name}:stop`);
    },
    ...overrides,
  };
}

describe("RuntimeKernel lifecycle", () => {
  it("runs init/start in dependency order and stop in reverse order", async () => {
    const calls: string[] = [];
    const kernel = new RuntimeKernel();

    kernel.register(trackingModule("db", calls));
    kernel.register({ ...trackingModule("api", calls), dependsOn: ["db"] });

    await kernel.init();
    await kernel.start();
    await kernel.stop();

    expect(calls).toEqual([
      "db:init",
      "api:init",
      "db:start",
      "api:start",
      "api:stop",
      "db:stop",
    ]);
  });

  it("rejects registering two modules with the same name", () => {
    const kernel = new RuntimeKernel();
    kernel.register({ name: "auth" });

    expect(() => kernel.register({ name: "auth" })).toThrow(DuplicateModuleError);
  });

  it("rejects a module that depends on an unregistered module", async () => {
    const kernel = new RuntimeKernel();
    kernel.register({ name: "api", dependsOn: ["missing"] });

    await expect(kernel.init()).rejects.toThrow(UnknownDependencyError);
  });

  it("detects a cyclic dependency", async () => {
    const kernel = new RuntimeKernel();
    kernel.register({ name: "a", dependsOn: ["b"] });
    kernel.register({ name: "b", dependsOn: ["a"] });

    await expect(kernel.init()).rejects.toThrow(CyclicDependencyError);
  });

  it("wraps a failing module's init error and marks it failed", async () => {
    const kernel = new RuntimeKernel();
    kernel.register({
      name: "flaky",
      init: () => {
        throw new Error("boom");
      },
    });

    await expect(kernel.init()).rejects.toThrow(ModuleLifecycleError);
    expect(kernel.getState("flaky")).toBe("failed");
  });

  it("continues stopping remaining modules even if one fails, then throws an aggregate error", async () => {
    const kernel = new RuntimeKernel();
    const stopped: string[] = [];

    kernel.register({
      name: "first",
      start: () => {},
      stop: () => {
        throw new Error("cannot stop first");
      },
    });
    kernel.register({
      name: "second",
      start: () => {},
      stop: () => {
        stopped.push("second");
      },
    });

    await kernel.init();
    await kernel.start();

    await expect(kernel.stop()).rejects.toThrow(AggregateError);
    expect(stopped).toEqual(["second"]);
  });

  it("emits lifecycle events for each module", async () => {
    const kernel = new RuntimeKernel();
    kernel.register({ name: "solo" });

    const onInit = vi.fn();
    const onStart = vi.fn();
    const onStop = vi.fn();
    kernel.events.on("module:initialized", onInit);
    kernel.events.on("module:started", onStart);
    kernel.events.on("module:stopped", onStop);

    await kernel.init();
    await kernel.start();
    await kernel.stop();

    expect(onInit).toHaveBeenCalledWith({ name: "solo" });
    expect(onStart).toHaveBeenCalledWith({ name: "solo" });
    expect(onStop).toHaveBeenCalledWith({ name: "solo" });
  });

  it("skips modules that never started when stopping", async () => {
    const kernel = new RuntimeKernel();
    const stopFn = vi.fn();
    kernel.register({ name: "never-started", stop: stopFn });

    await kernel.init();
    await kernel.stop();

    expect(stopFn).not.toHaveBeenCalled();
  });
});
