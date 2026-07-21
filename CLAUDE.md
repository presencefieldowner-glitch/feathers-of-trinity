# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Domain Node Platform" is an early-stage, polyglot monorepo (npm workspaces + a standalone Python
service). Only a small slice of the platform described in `README.md` is actually implemented:

- `core/runtime-kernel` — a TypeScript lifecycle/orchestration kernel (dependency-ordered module
  init/start/stop, an event bus, a resource manager, a scheduler).
- `services/api` — an Express + Prisma (SQLite) + Socket.IO authentication service, wired into the
  runtime kernel as a single `PlatformModule`.
- `engines/intelligence` — a minimal FastAPI skeleton (currently just a `/health` endpoint).

`README.md` documents the long-term vision (apps/, MemorySystem, SceneGraph, PromptInterpreter,
Visualization/Automation engines, Dashboard/Mapping/Analytics modules, etc.) — none of that exists
yet. Don't assume directories or components from the README are present; verify against the actual
tree before referencing them.

## Repository layout

```
core/runtime-kernel/     TS lib: RuntimeKernel, KernelEventBus, Scheduler, ResourceManager, topology
services/api/            Express API: auth module, Prisma/SQLite, Socket.IO realtime sync
engines/intelligence/    Python/FastAPI service (standalone, not an npm workspace)
presence/                Exploratory Python subsystem (standalone, not an npm workspace)
ecosystem/               Placeholder scaffold for the wider Presence Technology Ecosystem vision
.github/workflows/       CI (see caveat below)
```

`presence/` is a separate, exploratory prototype (`presence/README.md`) — plain-stdlib Python
modeling signal aggregation and intent-gating (`src/core/`), a classical mock "quantum" register and
concurrency limiter (`src/quantum/`), and a small pipeline plus historical/projected data pairing
(`src/daas/`). It has no dependencies and isn't wired into `services/api`, `engines/intelligence`, or
the runtime kernel — treat it as its own thing. Names like "RQubit," "MicroQuantum," and "temporal
echo" are project-specific naming, not references to real quantum computing or biological sensing;
each module and doc says so explicitly. Run its demo with `cd presence/src && python main.py`.

`ecosystem/` (`ecosystem/README.md`) is a structural placeholder for `ECOSYSTEM.md`'s full vision
tree — one Python module per branch (LakeTiticaca Interpreter, SAGE Framework, Quantum Audio,
Intelligence Layer, Visualization, Security, Developer Platform, Presence OS), one method per named
sub-component, and **every method raises `NotImplementedError`**, enforced by
`ecosystem/tests/test_scaffold.py`. Nothing in it performs real work. `ecosystem/security.py`
(`SecurityScaffold`) in particular is not a security system and must not be treated as one — the
only real auth in this repo is the JWT flow in `services/api`'s auth module described above. Don't
implement a placeholder method with anything beyond a toy/demo unless explicitly asked, and update
`ecosystem/tests/test_scaffold.py` deliberately when you do.

npm workspaces are declared in the root `package.json` as `services/*` and `core/*` only —
`engines/intelligence` is a separate Python project with its own `requirements.txt`/`pytest.ini`
and is not part of the npm workspace graph.

`services/api` depends on `core/runtime-kernel` via the workspace package
`@domain-node-platform/runtime-kernel`.

## Commands

### Root (drives all npm workspaces)
```
npm install
npm test              # runs `test` in every workspace that defines it
npm run build         # runs `build` in every workspace that defines it
```

### core/runtime-kernel
```
cd core/runtime-kernel
npm test                              # vitest run
npx vitest run tests/kernel.test.ts   # single test file
npx vitest run -t "cyclic"            # filter by test name
npm run typecheck                     # tsc --noEmit
```

### services/api
```
cd services/api
cp .env.example .env          # DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT
npm run prisma:generate       # generates client into src/generated/prisma (gitignored)
npm run prisma:migrate        # applies/creates migrations against dev.db
npm run dev                   # tsx watch src/server.ts
npm run build && npm start    # tsc -> dist, then node dist/server.js
npm test                      # vitest run
npx vitest run tests/auth.routes.test.ts   # single test file
```
Tests use a **separate** SQLite DB (`tests/testDbConfig.ts` → `tests/test.db`), created and torn
down by `tests/global-setup.ts` (runs `prisma migrate deploy` before the suite, deletes the DB file
after). Vitest config sets `fileParallelism: false` for this package — the test DB is shared
across files, so tests are not safe to parallelize across files.

### engines/intelligence
```
cd engines/intelligence
pip install -r requirements.txt
uvicorn app.main:app --reload      # dev server
pytest                             # full suite (pytest.ini: testpaths=tests, pythonpath=.)
pytest tests/test_health.py::test_health_returns_ok   # single test
```

No lint/format tooling (ESLint, Prettier, etc.) is configured anywhere in this repo — don't invoke
or assume one exists.

## Architecture

### Runtime kernel lifecycle
`RuntimeKernel` (`core/runtime-kernel/src/kernel.ts`) is the orchestration core every long-running
service is expected to plug into:

- Consumers implement `PlatformModule` (`name`, optional `dependsOn`, optional `init`/`start`/`stop`
  hooks in `module.ts`) and call `kernel.register(module)`.
- `resolveStartOrder` (`topology.ts`) topologically sorts registered modules by `dependsOn`, throwing
  `UnknownDependencyError` or `CyclicDependencyError` for bad graphs.
- `kernel.init()` / `kernel.start()` run each module's hook in dependency order; `kernel.stop()` runs
  in **reverse** order and only for modules that reached `"started"`. A hook failure marks the module
  `"failed"`, wraps the error in `ModuleLifecycleError`, and is re-thrown — `stop()` instead collects
  failures and throws an `AggregateError` after attempting to stop every remaining module.
- Lifecycle transitions are broadcast on `kernel.events` (`KernelEventBus`, a typed wrapper around
  Node's `EventEmitter`) as `module:initialized` / `module:started` / `module:stopped` / `module:error`.
- `Scheduler` and `ResourceManager` are standalone utilities (interval/timeout task handles;
  semaphore-style concurrency limiting via `acquire()`/`withResource()`) — not wired into the kernel
  itself, used independently by modules that need them.
- Also standalone, following the same pattern: `Telemetry` (in-memory counter/gauge store),
  `Diagnostics` (registered named health checks, aggregated into a pass/fail report),
  `PluginRuntime` (named-plugin registry, applies every plugin to a caller-supplied context), and
  `WorkflowEngine` (topologically sorts named steps by `dependsOn` and runs them in order — same
  cycle/unknown-dependency detection as module start-order resolution, but for ad hoc step
  sequences rather than `PlatformModule`s). `Router` is a minimal in-process method+path dispatcher,
  explicitly not a production API gateway — no auth, TLS, or transport of its own.

### services/api wiring
`src/server.ts` is the composition root: it builds the Express app (`app.ts`), creates a
`RuntimeKernel`, and registers exactly one `PlatformModule` — `createAuthPlatformModule`
(`authPlatformModule.ts`) — whose `init`/`start`/`stop` hooks connect Prisma, start the HTTP+Socket.IO
listener, and tear both down on `SIGTERM`. When adding a new service concern (e.g. a second domain
module), follow this pattern: build it as a `PlatformModule` and register it with the same kernel
rather than bootstrapping it separately in `server.ts`.

### Auth module (`src/modules/auth/`)
Standard layered structure: `auth.routes.ts` (Express router, Zod request validation) →
`auth.service.ts` (business logic, Prisma queries) → `password.ts` (bcrypt) / `jwt.ts`
(sign/verify, requires `JWT_SECRET` env var). Domain errors extend `AuthError` (carries an HTTP
`statusCode`); routes catch `AuthError` and map it to a response, and rethrow anything else. Auth
state changes emit on the process-local `authEvents` bus (`realtime/authEvents.ts`), which
`realtime/socket.ts` subscribes to in order to push `session:sync` events over Socket.IO to the
per-user room (`user:<userId>`). Socket.IO connections are authenticated via the same JWT
(`socket.handshake.auth.token`) as HTTP requests. The JWT payload (`AuthTokenPayload`) carries
`sub`/`email`/`sid` — `sid` is the session id, set when the token is issued in
`AuthService.createSession` and read by the socket auth middleware to know which `Session` row a
given connection belongs to.

**Session continuity / heartbeat**: `Session.lastSeenAt` (set at creation) is kept live two ways —
`AuthService.touchSession(sessionId, userId)` bumps it (no-ops, returning `false`, for a session
that doesn't exist, isn't owned by that user, or is already revoked), exposed over HTTP as
`POST /auth/sessions/:sessionId/heartbeat`, and automatically for any open Socket.IO connection: on
connect and then on a recurring interval (`RealtimeServerOptions.heartbeatIntervalMs`, default 30s)
via the kernel's `Scheduler`, cancelled on disconnect. This is why `createRealtimeServer` now takes
`prisma` as a parameter — it builds its own `AuthService` to call `touchSession`.

### Data model
Prisma schema (`services/api/src/db/prisma/schema.prisma`) targets SQLite: `User` (email/password
hash) has many `Session` (tracks `socketId`, `lastSeenAt`, `revokedAt` for revocation — see the
session continuity note above for how `lastSeenAt` gets updated). The generated Prisma client lands
in `src/generated/prisma` (gitignored, regenerate with `prisma:generate` after schema changes).

## Conventions

- All TypeScript packages are ESM (`"type": "module"`) — relative imports must use explicit `.js`
  extensions even though the source files are `.ts` (e.g. `import { ... } from "./kernel.js"`).
- Cross-workspace imports use the package name (`@domain-node-platform/runtime-kernel`), not relative
  paths across package boundaries.
- Request validation at API boundaries uses `zod` schemas defined next to the route handler.
- Domain-specific errors are modeled as `Error` subclasses per package (`KernelError` family in the
  kernel, `AuthError` family in the auth module) rather than generic thrown strings/objects.

## Known CI caveat

`.github/workflows/webpack.yml` runs `npx webpack` on push/PR to `main` across Node 18/20/22, but no
`webpack.config.js` or `webpack` dependency exists anywhere in the repo — treat this workflow as
stale/unverified rather than a working build check.
