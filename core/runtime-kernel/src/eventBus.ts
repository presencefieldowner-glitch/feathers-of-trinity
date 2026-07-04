import { EventEmitter } from "node:events";

export interface KernelEventMap {
  "module:initialized": [{ name: string }];
  "module:started": [{ name: string }];
  "module:stopped": [{ name: string }];
  "module:error": [{ name: string; phase: "init" | "start" | "stop"; error: unknown }];
  [key: string]: readonly unknown[];
}

export type EventBusListener<E extends readonly unknown[]> = (...args: E) => void;

export class TypedEventBus<EventMap extends Record<string, readonly unknown[]>> {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(0);
  }

  emit<K extends keyof EventMap & string>(event: K, ...args: EventMap[K]): boolean {
    return this.emitter.emit(event, ...args);
  }

  on<K extends keyof EventMap & string>(
    event: K,
    listener: EventBusListener<EventMap[K]>,
  ): () => void {
    this.emitter.on(event, listener as unknown as (...args: unknown[]) => void);
    return () => this.emitter.off(event, listener as unknown as (...args: unknown[]) => void);
  }

  once<K extends keyof EventMap & string>(
    event: K,
    listener: EventBusListener<EventMap[K]>,
  ): void {
    this.emitter.once(event, listener as unknown as (...args: unknown[]) => void);
  }

  off<K extends keyof EventMap & string>(
    event: K,
    listener: EventBusListener<EventMap[K]>,
  ): void {
    this.emitter.off(event, listener as unknown as (...args: unknown[]) => void);
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

export class KernelEventBus extends TypedEventBus<KernelEventMap> {}
