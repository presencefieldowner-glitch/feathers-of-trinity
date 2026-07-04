export type ReleaseFn = () => void;

export interface ResourceManagerOptions {
  readonly maxConcurrent: number;
}

export class ResourceManager {
  private readonly maxConcurrent: number;
  private inUse = 0;
  private readonly queue: Array<() => void> = [];

  constructor(options: ResourceManagerOptions) {
    if (options.maxConcurrent < 1) {
      throw new RangeError("maxConcurrent must be at least 1");
    }
    this.maxConcurrent = options.maxConcurrent;
  }

  get available(): number {
    return this.maxConcurrent - this.inUse;
  }

  get pending(): number {
    return this.queue.length;
  }

  acquire(): Promise<ReleaseFn> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        this.inUse += 1;
        resolve(() => this.release());
      };

      if (this.inUse < this.maxConcurrent) {
        tryAcquire();
      } else {
        this.queue.push(tryAcquire);
      }
    });
  }

  async withResource<T>(fn: () => Promise<T> | T): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }

  private release(): void {
    this.inUse -= 1;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }
}
