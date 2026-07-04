import { KernelEventBus } from "./eventBus.js";
import { DuplicateModuleError, ModuleLifecycleError } from "./errors.js";
import type { ModuleLifecycleState, PlatformModule } from "./module.js";
import { resolveStartOrder } from "./topology.js";

export class RuntimeKernel {
  readonly events = new KernelEventBus();

  private readonly modules = new Map<string, PlatformModule>();
  private readonly states = new Map<string, ModuleLifecycleState>();
  private startOrder: PlatformModule[] = [];

  register(module: PlatformModule): void {
    if (this.modules.has(module.name)) {
      throw new DuplicateModuleError(module.name);
    }
    this.modules.set(module.name, module);
    this.states.set(module.name, "registered");
  }

  getModule(name: string): PlatformModule | undefined {
    return this.modules.get(name);
  }

  getState(name: string): ModuleLifecycleState | undefined {
    return this.states.get(name);
  }

  async init(): Promise<void> {
    this.startOrder = resolveStartOrder([...this.modules.values()]);

    for (const module of this.startOrder) {
      await this.runPhase(module, "init", module.init);
      this.states.set(module.name, "initialized");
      this.events.emit("module:initialized", { name: module.name });
    }
  }

  async start(): Promise<void> {
    for (const module of this.startOrder) {
      await this.runPhase(module, "start", module.start);
      this.states.set(module.name, "started");
      this.events.emit("module:started", { name: module.name });
    }
  }

  async stop(): Promise<void> {
    const errors: ModuleLifecycleError[] = [];

    for (const module of [...this.startOrder].reverse()) {
      if (this.states.get(module.name) !== "started") {
        continue;
      }
      try {
        await this.runPhase(module, "stop", module.stop);
        this.states.set(module.name, "stopped");
        this.events.emit("module:stopped", { name: module.name });
      } catch (err) {
        errors.push(err as ModuleLifecycleError);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, "One or more modules failed to stop cleanly");
    }
  }

  private async runPhase(
    module: PlatformModule,
    phase: "init" | "start" | "stop",
    fn: ((context: { events: KernelEventBus }) => Promise<void> | void) | undefined,
  ): Promise<void> {
    if (!fn) {
      return;
    }
    try {
      await fn({ events: this.events });
    } catch (cause) {
      this.states.set(module.name, "failed");
      const error = new ModuleLifecycleError(module.name, phase, cause);
      this.events.emit("module:error", { name: module.name, phase, error });
      throw error;
    }
  }
}
