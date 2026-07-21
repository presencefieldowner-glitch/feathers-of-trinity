import { describe, expect, it } from "vitest";
import { DuplicatePluginError, PluginRuntime } from "../src/pluginRuntime.js";

describe("PluginRuntime", () => {
  it("applies every registered plugin to the given context", async () => {
    const runtime = new PluginRuntime<{ calls: string[] }>();
    runtime.register({ name: "a", apply: (ctx) => ctx.calls.push("a") });
    runtime.register({ name: "b", apply: (ctx) => ctx.calls.push("b") });

    const context = { calls: [] as string[] };
    await runtime.applyAll(context);

    expect(context.calls).toEqual(["a", "b"]);
    expect(runtime.list()).toEqual(["a", "b"]);
  });

  it("rejects registering two plugins with the same name", () => {
    const runtime = new PluginRuntime();
    runtime.register({ name: "dup", apply: () => {} });

    expect(() => runtime.register({ name: "dup", apply: () => {} })).toThrow(
      DuplicatePluginError,
    );
  });
});
