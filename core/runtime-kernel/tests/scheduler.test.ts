import { afterEach, describe, expect, it, vi } from "vitest";
import { Scheduler } from "../src/scheduler.js";

describe("Scheduler", () => {
  let scheduler: Scheduler;

  afterEach(() => {
    scheduler?.cancelAll();
    vi.useRealTimers();
  });

  it("invokes an interval task repeatedly until cancelled", () => {
    vi.useFakeTimers();
    scheduler = new Scheduler();
    const callback = vi.fn();

    const handle = scheduler.scheduleInterval(callback, 100);
    vi.advanceTimersByTime(350);
    expect(callback).toHaveBeenCalledTimes(3);

    scheduler.cancel(handle);
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("invokes a one-shot task exactly once after the delay", () => {
    vi.useFakeTimers();
    scheduler = new Scheduler();
    const callback = vi.fn();

    scheduler.scheduleOnce(callback, 100);
    vi.advanceTimersByTime(99);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("reports active task count and removes completed one-shot tasks", () => {
    vi.useFakeTimers();
    scheduler = new Scheduler();

    scheduler.scheduleOnce(() => {}, 50);
    expect(scheduler.activeCount).toBe(1);

    vi.advanceTimersByTime(50);
    expect(scheduler.activeCount).toBe(0);
  });

  it("cancel returns false for an unknown handle", () => {
    scheduler = new Scheduler();
    expect(scheduler.cancel("does-not-exist")).toBe(false);
  });

  it("cancelAll clears every pending task", () => {
    vi.useFakeTimers();
    scheduler = new Scheduler();
    const callback = vi.fn();
    scheduler.scheduleInterval(callback, 10);
    scheduler.scheduleOnce(callback, 10);

    expect(scheduler.activeCount).toBe(2);
    scheduler.cancelAll();
    expect(scheduler.activeCount).toBe(0);

    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });
});
