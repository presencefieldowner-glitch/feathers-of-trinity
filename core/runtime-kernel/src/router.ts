import { KernelError } from "./errors.js";

export type RouteHandler<Req = unknown, Res = unknown> = (req: Req) => Promise<Res> | Res;

interface Route<Req, Res> {
  readonly method: string;
  readonly path: string;
  readonly handler: RouteHandler<Req, Res>;
}

export class UnmatchedRouteError extends KernelError {
  constructor(method: string, path: string) {
    super(`No route registered for ${method} ${path}`);
  }
}

/**
 * A minimal in-process method+path request dispatcher. Not a production API
 * gateway (no auth, rate limiting, or transport) -- services/api uses Express
 * directly for that; this is for routing work between in-process modules.
 */
export class Router<Req = unknown, Res = unknown> {
  private readonly routes: Route<Req, Res>[] = [];

  register(method: string, path: string, handler: RouteHandler<Req, Res>): void {
    this.routes.push({ method: method.toUpperCase(), path, handler });
  }

  match(method: string, path: string): RouteHandler<Req, Res> | undefined {
    return this.routes.find(
      (route) => route.method === method.toUpperCase() && route.path === path,
    )?.handler;
  }

  async dispatch(method: string, path: string, req: Req): Promise<Res> {
    const handler = this.match(method, path);
    if (!handler) {
      throw new UnmatchedRouteError(method, path);
    }
    return handler(req);
  }
}
