# Architecture

This document owns the current technical structure and boundaries. Future work
belongs in GitHub Issues, not here.

## System

EloNew is a TypeScript monorepo:

- `apps/api`: NestJS/Fastify modular monolith and Socket.IO server.
- `apps/web`: Next.js App Router frontend and backend-for-frontend routes.
- `apps/workers`: BullMQ background processing runtime.
- `packages/auth`: shared roles and sealed session contracts.
- `packages/config`: shared environment, queue, and pricing configuration.
- `packages/database`: Prisma schema, migrations, and generated client.
- `packages/integrations`: external provider adapters.
- `packages/shared`: framework-neutral contracts, schemas, and utilities.

The frontend runs on Vercel. The API, workers, PostgreSQL, Redis, Alloy, and
Cloudflare Tunnel run in Docker Compose on one VPS.

## Backend

The API is organized by business module:

```text
modules/<feature>/
├── presentation/
├── application/
│   ├── ports/
│   └── use-cases/
├── domain/
├── infrastructure/
└── <feature>.module.ts
```

Use the full structure only when the module needs it. Keep simple modules
simple.

The request flow is:

```text
controller -> use-case -> port -> adapter/repository
```

Rules:

- Domain owns invariants and state transitions.
- Use-cases coordinate IO and transactions.
- Controllers handle transport only.
- Infrastructure implements ports and may depend on Nest, Prisma, or providers.
- DI tokens live beside their port contracts.
- Map data once at each boundary.

Cross-cutting HTTP concerns are declared, not registered in a central list, so
adding a route cannot silently skip them:

- Every route requires a bearer token. `JwtAuthGuard` and `RolesGuard` run as
  global guards, after throttling. Opt out with `@Public()`, or `@InternalApi()`
  for worker-to-API routes, which pairs the opt-out with the API key check.
- Rate limits come from `@RouteThrottle({ name, limit, ttlSeconds })`, where
  `limit` and `ttlSeconds` name numeric fields of `AppSettingsService`.
- Domain errors extend a status-bearing base (`NotFoundDomainError`,
  `ConflictDomainError`, ...) and the global filter derives the HTTP status from
  it. Override `httpMessage` when the response must not leak the reason.

## Frontend

- Route files compose feature modules and stay thin.
- Feature code lives under `apps/web/src/modules`.
- Reusable app-local code lives under `apps/web/src/shared`.
- Client components never read JWTs; sensitive sessions use httpOnly cookies and
  BFF routes.
- UI primitives remain app-local until a second real consumer exists.

## Packages

- Apps consume packages through declared dependencies and package exports.
- Runtime code never imports `packages/*/src/*`.
- Shared packages remain framework-neutral unless their purpose requires a
  framework.
- Add a package only when code has more than one real consumer or a distinct
  release/build boundary.
- Public exports are explicit package subpaths; broad barrels are unnecessary.

## Data and asynchronous work

- PostgreSQL is the source of truth.
- Prisma owns schema and migrations.
- Financial and related business-state changes share a transaction.
- BullMQ and Redis own retryable or delayed work.
- Jobs must be idempotent and safe to retry.
- Persisted REST data remains the recovery path for realtime delivery.

## Testing

- Unit tests protect domain and decision-heavy use-cases.
- API integration tests load real Nest modules with controlled boundaries.
- API E2E tests validate HTTP behavior.
- Database-backed suites validate Prisma behavior against PostgreSQL.
- Playwright validates user-visible flows.
- CI runs lint, typechecks, builds, application tests, and database-backed
  suites before production deployment.

## Technology

- Node.js 22 and pnpm workspaces
- TypeScript
- NestJS, Fastify, Socket.IO
- Next.js, React, Tailwind CSS
- PostgreSQL and Prisma
- Redis and BullMQ
- Zod
- Pino and Grafana Cloud
- Jest, Node test runner, and Playwright
- GitHub Actions, Docker Compose, Vercel, and Cloudflare Tunnel
