import { KernelError } from "./errors.js";

export interface Plugin<Context = unknown> {
  readonly name: string;
  apply(context: Context): Promise<void> | void;
}

export class DuplicatePluginError extends KernelError {
  constructor(name: string) {
    super(`Plugin "${name}" is already registered`);
  }
}

export class PluginRuntime<Context = unknown> {
  private readonly plugins = new Map<string, Plugin<Context>>();

  register(plugin: Plugin<Context>): void {
    if (this.plugins.has(plugin.name)) {
      throw new DuplicatePluginError(plugin.name);
    }
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): Plugin<Context> | undefined {
    return this.plugins.get(name);
  }

  list(): string[] {
    return [...this.plugins.keys()];
  }

  async applyAll(context: Context): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.apply(context);
    }
  }
}
