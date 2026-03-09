# AGENTS

## Project summary
Monorepo for a League of Legends boosting platform with:
- `apps/api` for NestJS backend
- `apps/web` for Next.js frontend
- `apps/workers` for background jobs
- `packages/*` for shared libraries (`shared`, `database`, `config`, `auth`, `ui`, `testing`, `integrations`)

## Source of truth
- Product requirements: `docs/requirements.md`
- Technical architecture and structure: `docs/tech-architecture.md`
- Database guidelines: `docs/database.md`
- Stack decisions: `docs/stack.md`
- Package management: `docs/packages.md`

## Documentation rule for AI agents
When documentation is needed, always use the official latest documentation.

## Dependency version rule for AI agents
- Do not modify auto-generated `package.json` dependency versions from framework scaffolds (Nest/Next generators).
- Use `@latest`/`latest` only when manually adding a new dependency or explicitly updating dependencies by hand.

## Command execution rule for AI agents
- Prefer `pnpx` instead of `pnpm dlx` for one-off CLI execution in general.
- If execution is blocked by network/sandbox/permission issues, explicitly ask for human intervention and wait for guidance/approval before retrying repeatedly.
- Dependency installation commands (for example `pnpm add`, `pnpm install`, `pnpm remove`) are allowed only after explicit user permission in the current task.
- After every medium or large code change, run `pnpm biome:fix:all` and typecheck before finalizing.
- Always ask for explicit user permission before running Git write actions (for example `git commit`, `git rebase`, `git merge`, `git tag`).
- Never run `git push` unless the user explicitly asks for it; even when explicitly asked, ask for confirmation immediately before executing it.

## Code style rule for AI agents
- Use indentation equivalent to 4 spaces (2 tabs).
- Do not add code comments unless strictly necessary (for example, temporary placeholders).
- YAML files must use spaces for indentation (never tabs).
- Prefer one-line `if` statements when there is only a single throw statement (for example: `if (!order) throw new Error('Order not found.');`).
- Avoid quick-fix type directives such as `/// <reference types=\"...\" />` for missing global types; prefer a proper project/package `tsconfig` fix (for example, `compilerOptions.types`) or explicit dependency configuration.
- Before adding new functions or utilities, first search the codebase for existing implementations and reuse/extend them when appropriate.
- Avoid bypassing existing abstractions with manual implementations (for example, do not read `process.env` directly in app/runtime code when `AppSettingsService`/config service is the project standard).
- Shared workspace packages must be consumed via package dependency + package exports entrypoints (for example `@packages/config/...`), never by importing `packages/*/src/*` from app code.

## Documentation maintenance rule for AI agents
- After every medium or large change, add a brief summary entry to the `## Changelog` section in this file.
- **Development Roadmap:** When a task in the `## Development Roadmap` is completed, mark it with an `[x]`.

## Issue execution workflow for AI agents
When the user says "let's start" on a GitHub issue or asks to begin issue work, follow this workflow by default:

1. Read the issue and confirm the real scope before coding.
   - Check the GitHub issue body.
   - Check `AGENTS.md` and the relevant docs under `docs/`.
   - Call out if the issue scope conflicts with roadmap/docs.

2. Create or switch to the issue branch before implementation.
   - Prefer a descriptive branch name tied to the issue number.
   - Do not start implementation on `main` unless the user explicitly asks for it.

3. Create an implementation plan before coding.
   - The plan should match codebase standards and the current architecture.
   - Keep it practical and decision-complete enough for implementation.

4. Use TDD with focus on core behavior first.
   - Start with fail-first tests for the decision-heavy/core feature behavior.
   - Do not force micro-TDD for every trivial wiring change; prefer TDD around the core business rules and critical flows.
   - After fail-first tests, implement the minimum needed to pass.
   - Refactor after the core behavior is green.

5. Verify after coding.
   - Run targeted tests during implementation.
   - After every medium or large code change, run `pnpm biome:fix:all`.
   - Verify TypeScript/TSX syntax and type correctness before finalizing. If there is no dedicated typecheck script, run project-appropriate `tsc --noEmit` checks.

6. Update issue progress as work advances.
   - Do not leave issue checkboxes only for the end.
   - When a checklist item or done-when item is actually complete, update the GitHub issue and mark it checked.
   - If follow-up debt is discovered that should not block the issue, create or update a separate issue for it.

7. Open the PR following the repository template.
   - Use the GitHub PR template structure.
   - Keep the PR scoped to the issue being delivered.
   - After creating the PR, assign it to `caiohenrqq` unless the user explicitly asks for a different assignee.
   - If unrelated local changes exist, do not include them in the issue commit/PR unless the user explicitly asks.

8. Ask for confirmation at the right moments.
   - Ask before Git write actions that require user permission by project rule.
   - During TDD-driven issue work, ask for confirmation after each major phase when the user requested that workflow (for example: fail-first tests added, core implementation green, refactor/verification complete).

Official docs to use:
- NestJS: https://docs.nestjs.com/
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Biome: https://biomejs.dev/
- Playwright: https://playwright.dev/docs/api/class-test
- pnpm: https://pnpm.io/installation
- TypeScript: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html

## Development Roadmap

### 1. Auth & User Management
- [ ] Implement `User` domain logic and Prisma repository.
- [ ] Create `SignUp` use-case with email confirmation placeholder.
- [ ] Create `Login` use-case with JWT and Refresh Token rotation.
- [ ] Implement `@Roles()` decorator and `AuthGuard` for RBAC.

### 2. Service Catalog & Pricing
- [ ] Implement Elo/Rank pricing engine (calculate subtotal based on rank difference).
- [ ] Implement deterministic pricing modifiers for all 10+ extras (FR-035 to FR-044).
- [ ] Create Zod schemas for order creation validation in `@packages/shared`.

### 3. Core Order Flow
- [ ] Complete `CreateOrder` use-case with `OrderCredentials` persistence.
- [x] Implement `AcceptOrder` and `RejectOrder` logic for boosters.
- [x] Implement `CancelOrder` with business rules (allow only before acceptance).
- [x] Implement `CompleteOrder` with automated credential deletion logic.

### 4. Payments Integration (Mercado Pago)
- [ ] Build `@packages/integrations/mercadopago` wrapper.
- [ ] Implement `HandleWebhook` use-case with idempotency (using `ProcessedWebhookEvent`).
- [ ] Map Mercado Pago states to internal `PaymentStatus` and trigger order transitions.

### 5. Booster Wallet & Finances
- [x] Implement `Wallet` domain logic for Credit/Debit ledger entries.
- [x] Create `WithdrawalRequest` flow for boosters.
- [x] Build background worker (BullMQ) for "Lock Period" timer to release funds.

### 6. Communication & Support
- [ ] Implement WebSocket gateway for real-time internal Chat.
- [ ] Create `Ticket` domain and use-cases for support history.
- [ ] Add `Rating` system (Client rates Booster and vice-versa).

### 7. Admin Governance
- [ ] Implement Admin Dashboard API (Financial metrics: Revenue, active orders).
- [ ] Create endpoints for Admin intervention (Force cancel, user block/unblock).

### 8. Frontend implementation (Next.js)
- [ ] Build shared component library in `@packages/ui`.
- [ ] Implement Client Dashboard (Order creation, active order tracking).
- [ ] Implement Booster Dashboard (Available orders queue, wallet management).
- [ ] Implement Admin Dashboard (Metric overview, user management, support view).

## Changelog
- Bootstrapped monorepo with `pnpm` workspace, `git init`, and base `apps/` + `packages/` structure.
- Scaffolded `apps/api` (NestJS) and `apps/web` (Next.js), added `apps/workers`, and removed default starter/demo code.
- Added project documentation under `docs/` (`requirements`, `tech-architecture`, `database`, `stack`, `commits`) and standardized requirement IDs (`FR-*`, `NFR-*`).
- Added Biome setup at root and project rules for agent behavior, command execution, and coding conventions.
- Added root and app-level `.gitignore`/env conventions with `.env.example` for each app.
- Added Docker development/prod structure under `infrastructure/docker/` with shared dev Dockerfile and compose files.
- Added root scripts for filtered app commands, Biome check/fix shortcuts, and Docker dev lifecycle commands.
- Started TDD on backend orders core with initial domain/use-case structure and Jest specs for order lifecycle and cancellation rules.
- Fixed Docker dev permission mismatch on `node_modules` volumes and added `docker:dev:reset` helper script for volume cleanup/rebuild.
- Expanded orders TDD coverage with `accept-order` and `confirm-payment` use-cases plus Jest specs for success, not-found, and invalid-transition scenarios.
- Fixed Docker dev startup to install dependencies before service watch mode and adjusted decorated type imports for Nest/TypeScript isolated modules.
- Added monorepo import aliases across apps (`@app`, `@modules`, and package aliases) and migrated current API orders code/tests to alias-based imports with Jest resolver mapping.
- Added orders module wiring (controller + in-memory repository adapter + create/get use-cases) and expanded TDD with controller integration coverage for HTTP-like lifecycle flows.
- Isolated Docker dev build artifacts (`api/dist`, `web/.next`, `workers/dist`) into named volumes to prevent host permission drift.
- Added `SystemModule` health endpoints scaffold in API with TDD coverage for separated checks (`/api/health/api`, `/api/health/database`, `/api/health/web`, `/api/health/workers`) returning `{ status: 'ok' }`.
- Refactored system health to one controller per target and added separated integration tests per controller plus unit tests for each health service.
- Standardized health module naming/structure to use-cases and moved files to `health/<target>/...` folders in both application and presentation layers with updated tests/imports.
- Added initial `payments` module with full feature-slice structure (domain, ports, use-cases, in-memory adapters, controller) and TDD coverage for 70% booster share plus hold/release lifecycle constraints.
- Enhanced payments TDD coverage with idempotent confirm/release behavior to safely handle retried operations without invalid transition errors.
- Added payment webhook idempotency support via processed-event port/use-case and endpoint coverage to ignore duplicated event IDs safely.
- Refactored orders error handling to typed domain/application errors with controller `instanceof` mapping and expanded TDD coverage for HTTP exception mapping.
- Standardized API integration test location under `apps/api/test/integration/<module_name>/*.integration.spec.ts` and documented test conventions (unitary/domain/use-cases, integration, e2e) in technical architecture.
- Renamed infrastructure `gateways` nomenclature to `adapters` and adjusted module integration test naming to focus on module-level integration semantics.
- Added `payments/domain/payment.errors.ts` and refactored payments domain/use-cases/controller to typed error handling with `instanceof` mapping and updated TDD assertions.
- Updated root Biome all-workspace scripts to run from repository root (respecting ignore rules, including artifacts) and moved Prisma env-file loading to `packages/database/prisma.config.ts` to keep database package scripts clean.
- Fixed API Nest runtime entrypoint resolution by enabling webpack build in `apps/api/nest-cli.json`, restoring `dist/main.js` output for watch/prod execution.
- Switched Prisma command env injection to `dotenv-cli` from scripts, simplified `prisma.config.ts` to validation/config only, and added root-level `dotenv-cli` dependency declaration.
- Moved Prisma operational commands to root-level `db:*` scripts with `dotenv-cli` and removed app-specific env orchestration scripts from `@packages/database` to keep package boundaries clean.
- Added root `db` script alias and simplified root `db:*` commands to rely on Prisma auto-loading the package-local `prisma.config.ts` (removed explicit `--config` flags).
- Added Prisma/Postgres adapters for orders and payments ports (`order`, `payment`, and processed webhook event persistence), introduced Prisma-backed order-status adapter, and wired modules to use Prisma outside tests while keeping in-memory adapters for test runtime.
- Replaced `NODE_ENV`-based persistence branching with explicit DI token-based persistence selection (`inmemory|prisma`) and updated integration tests to override persistence driver provider directly.
- Reverted persistence-driver token wiring and restored the previous test strategy using existing module behavior for integration tests.
- Replaced ad-hoc `prisma.config.ts` Node type directive with a proper `packages/database/tsconfig.json` (`types: [\"node\"]`) and documented rule to avoid quick-fix triple-slash type directives.
- Added API-level `AppConfigModule`/`AppConfigService` for typed env access and updated bootstrap/Prisma runtime code to consume env values through config service instead of direct env reads.
- Added new intentionally failing tests for orders/payments TDD backlog (order existence validation on payment creation, idempotent order payment confirmation retries, and non-finite payment amount rejection).
- Implemented TDD fixes for orders/payments backlog: payment creation now validates related order existence, payment amount validation rejects non-finite values, and order payment-confirmation use-case is idempotent for retry scenarios.
- Renamed API config surface to `common/settings` with `AppSettingsModule`/`AppSettingsService` and updated module/bootstrap/database imports to remove `app-config` naming.
- Updated API build/Prisma scripts to use root `db:*` commands and rebuilt `dist` to remove stale `app-config` runtime imports after settings-module rename.
- Aligned Prisma 7 runtime setup with adapter-based connection approach (`@prisma/adapter-pg`) in API Prisma service and reduced `AppSettingsService` to only currently used env keys.
- Documented and fixed Prisma 7 migration/runtime issue where API failed with `PrismaClientInitializationError` due to legacy datasource URL expectations; solution was to keep datasource URL out of `schema.prisma`, configure Prisma runtime through `PrismaClient({ adapter: new PrismaPg({ connectionString }) })`, add `@prisma/adapter-pg` + `pg` dependencies, and clean env-service typing to active keys.
- Refactored shared Prisma location from `src/infrastructure/database` to `src/common/prisma` and updated API modules/tests imports to improve project navigation and Ctrl+P discoverability.
- Stabilized API integration/e2e test wiring by overriding repository/status port providers with explicit in-memory adapters in test modules, removing direct Prisma cleanup calls that made tests depend on external Postgres reachability.
- Refactored duplicated persisted-enum validation in Orders/Payments Prisma adapters and repositories into shared `common/persistence` utility, and expanded repository/adapter specs to cover invalid persisted status scenarios explicitly.
- Added root-level implementation plan file `orders-payment-tdd-refactor.md` and executed the first refactor wave with shared controller domain-error mapping utility for Orders and Payments.
- Added backend Dual-Lane testing structure with dedicated DB-backed Jest configs and suites (`test:integration:db`, `test:e2e:db`) while preserving fast default in-memory integration flow.
- Added minimal Mercado Pago SDK integration placeholders under `packages/integrations/src/mercadopago` with explicit `Not implemented yet` behavior to preserve planned boundaries without premature implementation.
- Added host-side DB test bootstrap scripts (`db:test:prepare`) that automatically ensure `elonew_test` exists via Docker Postgres service and apply Prisma migrations before DB-backed integration/e2e lanes.
- Removed manual DB test prepare dependency from API test commands; `test:integration:db` and `test:e2e:db` now auto-bootstrap test DB existence and migrations through `db:test:prepare` (`database-test-setup.sh` + `database-test-ensure-exists.sh`).
- Fixed API dev/prod bootstrap path mismatch where Nest looked for `apps/api/dist/main` but TypeScript emitted nested output due external-source config imports; moved API env validation/type to `src/common/settings` so build emits `dist/main.js` consistently.
- Restored shared config architecture through `@packages/config` package exports (without barrel files), added package build step, and removed direct app imports to `packages/config/src/*` to keep runtime boundaries stable.
- Stabilized API Docker watch mode by setting `apps/api/nest-cli.json` `compilerOptions.deleteOutDir` to `false` to avoid transient incremental rebuild races causing `MODULE_NOT_FOUND` in `dist` during app restart.
- Added `api` dev startup flow `start:dev:clean` (`rm -rf dist` once on startup) and wired Docker dev API service to it, preventing stale artifact carry-over without requiring full `api build` in day-to-day development.
- Hardened API bootstrap against dev-watch restart races by closing a previous in-process app instance and retrying `app.listen` on `EADDRINUSE` with short backoff in `src/main.ts`.
- Replaced API Docker dev hot-reload runtime with stable model (`nest build --watch` + single `node --watch dist/main.js` via `api-dev-watch-runner.sh`) and simplified `src/main.ts` bootstrap, removing temporary `EADDRINUSE` retry/lock workaround.
- Moved persisted-enum helper ownership from API `common/persistence` to shared package `@shared/utils/enum.utils`, removed API-local persistence folder, and updated Orders/Payments Prisma adapter/repository imports accordingly.
- Refined the `## Development Roadmap` in `AGENTS.md` with granular sub-tasks for each core feature to improve progress tracking.
- Implemented TDD-driven Orders/Payments core gap closure (without Mercado Pago adapter work): added Reject/Complete/SaveCredentials order flows, persisted `OrderCredentials` mapping in Prisma repository, wired payment confirm/webhook to trigger order paid transition via payments port adapter, expanded module integration and use-case/domain tests, and marked completed Core Order Flow roadmap items.
- Refined Orders/Payments test strategy to focus unit tests on decision-heavy logic: removed low-value wiring-oriented unit specs (`get-order`, `get-payment`, and processed webhook repository), and added missing decision-path unit coverage (confirm-payment no-call on missing payment, webhook non-processed on downstream failure, release-hold not-found branches, and credentials allowed in `in_progress`).
- Expanded Orders/Payments TDD coverage with adapter unit tests, credentials overwrite/completion edge-case tests, controller-level error-mapping tests for new order endpoints, DB-lane credential lifecycle integration tests, and a Prisma order-repository fix to make credential deletion idempotent in DB-backed flows.
- Updated the agent issue workflow to require assigning issue-delivery PRs to `caiohenrqq` after creation.
- Implemented issue `#7` wallet core and runtime flow: added wallet locked/withdrawable domain/use-cases with TDD, introduced API wallet module/controllers plus Prisma repository scaffolding, wired order completion to trigger booster earnings credit through a port, added configurable `WALLET_LOCK_PERIOD_HOURS`, and created a worker HTTP trigger for releasing matured wallet funds.
