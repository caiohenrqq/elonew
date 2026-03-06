# Technical Architecture

## Architecture summary
The platform is built as a modular monolith in a pnpm monorepo. This gives us clear module boundaries, predictable deployment, and enough flexibility to split services later if scale or team structure requires it.

## Core rule: clarity first
This project prioritizes clarity over theoretical perfection. The architecture must be easy to understand, easy to onboard, and easy to change safely.

Practical implications:
- Prefer explicit, readable module boundaries over clever abstractions.
- Apply advanced patterns only where business complexity justifies them.
- Keep simple CRUD flows simple; reserve heavier architecture for high-risk domains.

## Dashboard and app strategy
- Keep a single frontend app in `apps/web` with role-based areas for `Cliente`, `Booster`, and `Admin`.
- Keep backend services in `apps/api`.
- Keep background job runtime in `apps/workers`.
- Centralize cross-app concerns in `packages/*`.

## Repository layout
```text
/
├─ apps/
│  ├─ api/
│  │  └─ src/
│  │     ├─ modules/
│  │     │  ├─ auth/
│  │     │  ├─ users/
│  │     │  ├─ orders/
│  │     │  ├─ payments/
│  │     │  ├─ tickets/
│  │     │  ├─ chat/
│  │     │  └─ admin/
│  │     ├─ common/
│  │     └─ main.ts
│  ├─ web/
│     └─ src/
│        ├─ app/
│        │  ├─ (public)/
│        │  ├─ (client)/
│        │  ├─ (booster)/
│        │  └─ (admin)/
│        ├─ features/
│        ├─ entities/
│        ├─ shared/
│        └─ middleware.ts
│  └─ workers/
│     └─ src/
│        ├─ processors/
│        ├─ schedules/
│        └─ main.ts
├─ packages/
│  ├─ shared/
│  ├─ database/
│  ├─ config/
│  ├─ auth/
│  ├─ ui/
│  ├─ testing/
│  └─ integrations/
├─ pnpm-lock.yaml
├─ package.json
└─ tsconfig.base.json
```

## TypeScript boundaries and aliases
Use internal aliases to keep imports stable as packages evolve:
- `@shared/*`
- `@database/*`
- `@auth/*`
- `@ui/*`
- `@testing/*`
- `@integrations/*`

Boundary rule:
- Apps must consume shared workspace libraries as packages (dependency + package exports), not through direct `packages/*/src/*` imports.
- Avoid TS path aliases from apps to another package `src` folder because this leaks package internals into app build output.

### API dev-watch stability note
- In Docker/polling watch mode, keep `apps/api/nest-cli.json` with `compilerOptions.deleteOutDir: false`.
- Reason: deleting `dist` before each incremental rebuild can trigger transient `MODULE_NOT_FOUND` (for example `./app-settings.service`) during restart race conditions.
- For Docker dev runtime, prefer `nest build --watch` plus a single `node --watch dist/main.js` process instead of `nest start --watch`.
- Reason: `nest start --watch` can overlap old/new app listeners and produce transient `EADDRINUSE` on `3000` during hot reload.

## Package purposes

### `@shared` (`packages/shared`)
Cross-app domain contracts with no UI/framework coupling.
- DTOs and API contracts.
- Zod schemas for payload validation.
- Enums and constants (`roles`, `orderStatus`, `paymentStatus`).
- Shared domain types and pure utility functions.

### `@database` (`packages/database`)
Database ownership package.
- Prisma schema and migrations.
- Generated database client.
- Seed scripts and DB helpers.

### `@config` (`packages/config`)
Centralized project standards.
- Shared `tsconfig` presets.
- Shared ESLint and Prettier configuration.
- Reusable environment/config conventions.
- Export env/contracts via package subpath exports and import from app/runtime code using package paths (for example `@packages/config/env/env.schema`).

### `@auth` (`packages/auth`)
Authorization and policy rules reused by API and web.
- Role and permission definitions.
- Policy helpers (`can/cannot` checks).
- Resource-level access rules (orders, tickets, admin actions).

### `@ui` (`packages/ui`)
Reusable UI components and design primitives for the web app.
- Base components (`Button`, `Input`, `Modal`, `Table`).
- Composed dashboard components (`StatCard`, `DataTable`, `PageHeader`).
- Theme tokens and shared styling primitives.

### `@testing` (`packages/testing`)
Shared testing assets.
- Factories and fixtures.
- Integration test helpers and mocks.
- Common assertions and test utilities.

### `@integrations` (`packages/integrations`)
External provider adapters and integration logic.
- Mercado Pago client wrappers and webhook validation.
- Retry/idempotency helpers for provider calls.
- Provider-specific mapping/parsing kept outside core modules.

## Backend architecture
- Style: modular monolith.
- Internal style: pragmatic hexagonal/layered modules.
- API protocol: REST.
- API contracts: OpenAPI/Swagger.
- Authentication: JWT access token + refresh token rotation.

Initial backend modules:
- `auth`
- `users`
- `services`
- `orders`
- `payments`
- `wallet`
- `chat`
- `tickets`
- `ratings`
- `admin`

Design principle: business rules live in domain/application services, not controllers.

## API module structure (pragmatic hexagonal)
This is hexagonal architecture in practice: application and domain depend on ports; infrastructure provides adapters.

Recommended module layout:
```text
modules/<feature>/
├─ presentation/            # controllers, request/response DTOs, http mappers
├─ application/             # use-cases and application services
│  ├─ ports/                # repository/adapter/event interfaces + DI keys
│  └─ use-cases/
├─ domain/                  # entities, value objects, business policies, domain errors
├─ infrastructure/          # prisma repositories, external adapters, persistence mappers
└─ <feature>.module.ts
```

Request flow:
- `Controller -> UseCase -> Port -> Adapter/Repository -> DB or Provider`

### Project standard for feature slices
To keep structure predictable across the codebase:
- In `application`, prefer `use-cases` naming instead of generic `services` for business actions.
- Keep use-case folders simple when complexity is low.
  - For simple modules (for example health checks returning a static status), use `application/use-cases/health/*.use-case.ts` without extra subfolders.
  - Only add deeper subfolders per target when behavior becomes complex and needs stronger separation.
- In `presentation`, keep one controller per feature target when endpoints are separated by responsibility.
- Keep tests pragmatic by complexity:
  - for simple/trivial use-cases, unit tests are optional
  - for modules, keep integration tests because they verify wiring and boundary behavior across layers

Example (health):
```text
modules/system/
├─ application/
│  └─ use-cases/
│     └─ health/
│        ├─ api-health.use-case.ts
│        ├─ database-health.use-case.ts
│        ├─ web-health.use-case.ts
│        └─ workers-health.use-case.ts
├─ presentation/
│  └─ health/
│     ├─ api/
│     │  ├─ api-health.controller.ts
│     ├─ database/
│     ├─ web/
│     └─ workers/
└─ system.module.ts

apps/api/test/integration/system/
├─ api-health.integration.spec.ts
├─ database-health.integration.spec.ts
├─ web-health.integration.spec.ts
└─ workers-health.integration.spec.ts
```

How strongly to apply this:
- Full structure for complex modules: `orders`, `payments`, `wallet`, provider/webhook flows.
- Lighter structure allowed for low-risk CRUD modules.

## Avoiding anemic domain with use-cases
Using use-cases does not require an anemic domain. The key is responsibility split:
- Domain owns business invariants and decision rules.
- Use-cases orchestrate workflow, IO calls, and transaction boundaries.

Responsibility guide:
- Domain responsibilities: state transition rules, value validation, money/rank rules, eligibility policies.
- Use-case responsibilities: load data through ports, call domain methods, persist changes, emit events, return application result.

Rule of thumb:
- If a rule must always be true for business correctness, keep it in `domain`.
- If logic coordinates steps across systems, keep it in `application/use-cases`.

Example:
- `Order.cancel(requestedBy)` in domain enforces cancellation constraints.
- `CancelOrderUseCase` authenticates context, loads order, calls `order.cancel(...)`, persists, and publishes notifications.

## Ports, adapters, and DI keys
Nest can use interfaces at type-check time, but interfaces do not exist at runtime. Dependency injection for ports therefore uses DI keys (also known as provider tokens in Nest).

Guideline:
- Define ports in `application/ports`.
- Define each DI key next to its corresponding port interface in `application/ports`.
- Bind DI keys to concrete adapters in `<feature>.module.ts`.
- Inject ports into use-cases via `@Inject(DI_KEY)`.

Placement rule:
- Do not define DI keys inside concrete repository/adapter implementation files.
- Keep DI keys at the port boundary so implementations remain swappable and contracts stay clear.

This keeps use-cases independent from concrete infrastructure and makes tests simpler (swap adapters with test doubles).

## Mapping strategy (avoid unnecessary duplication)
Some mapping across DTO, domain, and persistence models is expected. Keep it controlled:
- Map exactly once at each boundary.
- Keep mapper functions centralized (`presentation/mappers`, `infrastructure/mappers`).
- Do not inline mapping logic inside controllers or repositories.
- Keep naming consistent across layers to reduce translation noise.
- Use small value objects for repeated validation/transformation logic.

Boundary model ownership:
- DTO model: transport/API boundary only.
- Domain model: business rules only.
- Persistence model: database boundary only.

## Frontend architecture
- Next.js App Router.
- Role-based route groups: `(public)`, `(client)`, `(booster)`, `(admin)`.
- SSR where auth/security and first-load UX benefit from server rendering.
- Forms with React Hook Form + Zod resolver.
- Server state with TanStack Query.

## Data and asynchronous processing
- Data access and migrations: Prisma.
- Queue and delayed jobs: BullMQ + Redis.
- Worker execution runtime: `apps/workers`.

Initial background jobs:
- Payment webhook retries.
- Delayed withdrawal unlock.
- Email/notification processing.

## Logging and observability
- Structured logs with Pino.
- Nest integration through `nestjs-pino`.
- Correlation identifiers propagated across API requests and jobs.
- OpenTelemetry for tracing/metrics and cross-service visibility.

Primary telemetry focus:
- Order and payment path tracing end-to-end.
- Queue processing latency and retries.
- Fast root-cause analysis for failed state transitions.

## Error monitoring strategy
Start with OpenTelemetry + structured logs and self-hosted-compatible tooling. Revisit paid SaaS only when incident volume or MTTR justifies the added cost.

## Testing and CI
- Unit/integration tests: Jest.
- Browser E2E tests: Playwright.
- CI pipeline: GitHub Actions.

Testing conventions:
- Unitary tests must be written for `domain` and `application/use-cases`.
- Integration tests for API modules live in `apps/api/test/integration/<module_name>/*.integration.spec.ts`.
- Integration tests must load the real Nest module (`Test.createTestingModule({ imports: [<Module>] })`) and validate wiring between controller, use-cases, and adapters.
- E2E tests live in `apps/api/test/*.e2e-spec.ts` and validate HTTP boundaries with the application bootstrap.
- Use a Dual-Lane strategy for backend tests:
  - In-memory lane (default): fast module integration and e2e tests with explicit DI overrides for repositories/ports.
  - Postgres lane (`test:integration:db`, `test:e2e:db`): persistence-backed tests under `apps/api/test/integration-db/**` and `*.db.e2e-spec.ts`.

## Boundaries
- `@shared` must stay framework-agnostic and import-safe for both `api` and `web`.
- `@ui` is frontend-only and must not be imported by `api`.
- `apps/workers` is an executable runtime and should not be modeled as a reusable package.
- Reusable worker helpers can live in packages when needed, but processors/schedulers run from `apps/workers`.
- Permission checks must be enforced in `api` even if `web` also hides actions by role.
- `domain` must not depend on Nest, Prisma, or provider SDKs.
- `application` can use Nest DI but should only depend on ports, not concrete adapters.
- `infrastructure` may depend on framework/provider details and must implement ports.

## Design Patterns
- Ports and Adapters Pattern: Separate core business logic from external systems through ports (interfaces) and adapters (implementations). We use it for repositories, payment provider adapters, queues, email, and third-party APIs because it solves infrastructure coupling and makes provider swaps and testing safer.
- Use-case (Application Service) Pattern: Represent each business action as a dedicated use-case class that orchestrates one workflow. We use it for actions like `create-order`, `accept-order`, `confirm-payment`, and `request-withdrawal` because it solves controller/service sprawl and keeps flow logic explicit.
- Repository Pattern: Isolate persistence concerns behind repository contracts. We use it for ports such as `OrderRepositoryPort`, `WalletRepositoryPort`, and `TicketRepositoryPort` because it solves direct database dependency in business layers.
- Strategy Pattern: Encapsulate interchangeable rule implementations behind a common contract. We use it for pricing modifiers, coupon behavior, and similar variable rules because it solves large conditional chains and supports safe extension.
- Explicit State Transition Pattern: Model allowed status changes in a defined transition map/policy. We use it for order, payment, and withdrawal states because it solves illegal transitions and makes lifecycle behavior predictable.
- Domain Events + Outbox Pattern: Persist side-effect events with transactional writes and publish them asynchronously. We use it for post-payment notifications, unlock scheduling, and audit-related events because it solves lost-event and cross-system consistency issues.
- Idempotency Pattern: Ensure repeated processing of the same input yields the same effective result. We use it for webhook handling and retryable worker operations because it solves duplicate side effects from retries and redeliveries.
- Anti-Corruption Layer Pattern: Translate external provider models into internal models at the integration boundary. We use it in `@integrations` (for example, Mercado Pago payload mapping) because it solves leakage of provider-specific schema details into domain logic.
