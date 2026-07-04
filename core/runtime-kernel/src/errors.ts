export class KernelError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "KernelError";
  }
}

export class DuplicateModuleError extends KernelError {
  constructor(name: string) {
    super(`Module "${name}" is already registered`);
  }
}

export class UnknownDependencyError extends KernelError {
  constructor(moduleName: string, dependencyName: string) {
    super(`Module "${moduleName}" depends on unknown module "${dependencyName}"`);
  }
}

export class CyclicDependencyError extends KernelError {
  constructor(cycle: readonly string[]) {
    super(`Cyclic module dependency detected: ${cycle.join(" -> ")}`);
  }
}

export class ModuleLifecycleError extends KernelError {
  constructor(
    public readonly moduleName: string,
    public readonly phase: "init" | "start" | "stop",
    cause: unknown,
  ) {
    super(`Module "${moduleName}" failed during "${phase}": ${String(cause)}`, cause);
  }
}
