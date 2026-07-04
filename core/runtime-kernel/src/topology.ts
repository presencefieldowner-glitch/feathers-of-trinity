import { CyclicDependencyError, UnknownDependencyError } from "./errors.js";
import type { PlatformModule } from "./module.js";

export function resolveStartOrder(modules: readonly PlatformModule[]): PlatformModule[] {
  const byName = new Map(modules.map((module) => [module.name, module]));

  for (const module of modules) {
    for (const dependency of module.dependsOn ?? []) {
      if (!byName.has(dependency)) {
        throw new UnknownDependencyError(module.name, dependency);
      }
    }
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: PlatformModule[] = [];

  const visit = (module: PlatformModule, path: string[]): void => {
    if (visited.has(module.name)) {
      return;
    }
    if (visiting.has(module.name)) {
      throw new CyclicDependencyError([...path, module.name]);
    }

    visiting.add(module.name);
    for (const dependencyName of module.dependsOn ?? []) {
      visit(byName.get(dependencyName)!, [...path, module.name]);
    }
    visiting.delete(module.name);
    visited.add(module.name);
    order.push(module);
  };

  for (const module of modules) {
    visit(module, []);
  }

  return order;
}
