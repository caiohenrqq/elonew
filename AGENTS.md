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

## Documentation rule for AI agents
When documentation is needed, always use the official latest documentation.

## Dependency version rule for AI agents
- Do not modify auto-generated `package.json` dependency versions from framework scaffolds (Nest/Next generators).
- Use `@latest`/`latest` only when manually adding a new dependency or explicitly updating dependencies by hand.

## Command execution rule for AI agents
- Prefer `pnpx` instead of `pnpm dlx` for one-off CLI execution in general.
- If execution is blocked by network/sandbox/permission issues, explicitly ask for human intervention and wait for guidance/approval before retrying repeatedly.
- Do not run dependency installation commands directly (for example `pnpm add`, `pnpm install`, `pnpm remove`); ask the user to run them manually and continue after confirmation.
- After every medium or large code change, run `pnpm biome:fix:all` and typecheck before finalizing.
- Always ask for explicit user permission before running Git write actions (for example `git commit`, `git rebase`, `git merge`, `git tag`).
- Never run `git push` unless the user explicitly asks for it; even when explicitly asked, ask for confirmation immediately before executing it.

## Code style rule for AI agents
- Use indentation equivalent to 4 spaces (2 tabs).
- Do not add code comments unless strictly necessary (for example, temporary placeholders).
- YAML files must use spaces for indentation (never tabs).
- Prefer one-line `if` statements when there is only a single throw statement (for example: `if (!order) throw new Error('Order not found.');`).
- Avoid quick-fix type directives such as `/// <reference types=\"...\" />` for missing global types; prefer a proper project/package `tsconfig` fix (for example, `compilerOptions.types`) or explicit dependency configuration.

## Documentation maintenance rule for AI agents
- After every medium or large change, add a brief summary entry to the `## Changelog` section in this file.

Official docs to use:
- NestJS: https://docs.nestjs.com/
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Biome: https://biomejs.dev/
- Playwright: https://playwright.dev/docs/api/class-test
- pnpm: https://pnpm.io/installation
- TypeScript: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html

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
