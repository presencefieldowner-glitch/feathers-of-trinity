import type { KernelEventBus } from "./eventBus.js";

export type ModuleLifecycleState =
  | "registered"
  | "initialized"
  | "started"
  | "stopped"
  | "failed";

export interface ModuleContext {
  readonly events: KernelEventBus;
}

export interface PlatformModule {
  readonly name: string;
  readonly dependsOn?: readonly string[];
  init?(context: ModuleContext): Promise<void> | void;
  start?(context: ModuleContext): Promise<void> | void;
  stop?(context: ModuleContext): Promise<void> | void;
}
