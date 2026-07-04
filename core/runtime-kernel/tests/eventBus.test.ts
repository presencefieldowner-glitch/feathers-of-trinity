import { describe, expect, it, vi } from "vitest";
import { TypedEventBus } from "../src/eventBus.js";

interface TestEventMap {
  greet: [{ name: string }];
  [key: string]: readonly unknown[];
}

describe("TypedEventBus", () => {
  it("delivers emitted events to subscribed listeners", () => {
    const bus = new TypedEventBus<TestEventMap>();
    const listener = vi.fn();

    bus.on("greet", listener);
    bus.emit("greet", { name: "ada" });

    expect(listener).toHaveBeenCalledWith({ name: "ada" });
  });

  it("supports unsubscribing via the returned function", () => {
    const bus = new TypedEventBus<TestEventMap>();
    const listener = vi.fn();

    const unsubscribe = bus.on("greet", listener);
    unsubscribe();
    bus.emit("greet", { name: "ada" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("supports unsubscribing via off()", () => {
    const bus = new TypedEventBus<TestEventMap>();
    const listener = vi.fn();

    bus.on("greet", listener);
    bus.off("greet", listener);
    bus.emit("greet", { name: "ada" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("only invokes a once() listener a single time", () => {
    const bus = new TypedEventBus<TestEventMap>();
    const listener = vi.fn();

    bus.once("greet", listener);
    bus.emit("greet", { name: "ada" });
    bus.emit("greet", { name: "grace" });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("removeAllListeners clears every subscriber", () => {
    const bus = new TypedEventBus<TestEventMap>();
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    bus.on("greet", listenerA);
    bus.on("greet", listenerB);
    bus.removeAllListeners();
    bus.emit("greet", { name: "ada" });

    expect(listenerA).not.toHaveBeenCalled();
    expect(listenerB).not.toHaveBeenCalled();
  });
});
