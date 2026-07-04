import { describe, expect, it } from "vitest";
import { ResourceManager } from "../src/resourceManager.js";

describe("ResourceManager", () => {
  it("throws when constructed with a non-positive limit", () => {
    expect(() => new ResourceManager({ maxConcurrent: 0 })).toThrow(RangeError);
  });

  it("grants acquisitions immediately while under the limit", async () => {
    const manager = new ResourceManager({ maxConcurrent: 2 });

    const releaseA = await manager.acquire();
    expect(manager.available).toBe(1);

    const releaseB = await manager.acquire();
    expect(manager.available).toBe(0);

    releaseA();
    releaseB();
    expect(manager.available).toBe(2);
  });

  it("queues an acquisition beyond the limit until a resource is released", async () => {
    const manager = new ResourceManager({ maxConcurrent: 1 });
    const releaseFirst = await manager.acquire();

    let secondAcquired = false;
    const secondAcquirePromise = manager.acquire().then((release) => {
      secondAcquired = true;
      return release;
    });

    expect(manager.pending).toBe(1);
    expect(secondAcquired).toBe(false);

    releaseFirst();
    const releaseSecond = await secondAcquirePromise;
    expect(secondAcquired).toBe(true);

    releaseSecond();
  });

  it("withResource releases the slot even when the callback throws", async () => {
    const manager = new ResourceManager({ maxConcurrent: 1 });

    await expect(
      manager.withResource(() => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(manager.available).toBe(1);
  });

  it("withResource returns the callback's resolved value", async () => {
    const manager = new ResourceManager({ maxConcurrent: 1 });
    const result = await manager.withResource(() => 42);
    expect(result).toBe(42);
  });
});
