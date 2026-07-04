import { EventEmitter } from "node:events";

export interface SessionCreatedEvent {
  sessionId: string;
  userId: string;
  email: string;
  createdAt: string;
}

export interface SessionRevokedEvent {
  sessionId: string;
  userId: string;
  revokedAt: string;
}

interface AuthEventMap {
  "session:created": [SessionCreatedEvent];
  "session:revoked": [SessionRevokedEvent];
}

class AuthEventBus extends EventEmitter {
  emit<K extends keyof AuthEventMap>(event: K, ...args: AuthEventMap[K]): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof AuthEventMap>(event: K, listener: (...args: AuthEventMap[K]) => void): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }
}

export const authEvents = new AuthEventBus();
