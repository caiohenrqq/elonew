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

## Prisma migration rule for AI agents
- Do not hand-write standalone SQL migration files by default.
- When a Prisma schema change requires a migration, update `schema.prisma` first and then ask the user to run `pnpm db:migrate:dev --name <migration_name>` manually.
- If a generated migration needs review, inspect the produced `migration.sql` after generation instead of prewriting it by hand.

## Command execution rule for AI agents
- Prefer `pnpx` instead of `pnpm dlx` for one-off CLI execution in general.
- Prefer `gh` for GitHub operations whenever possible instead of manual browser-based or raw API flows.
- If execution is blocked by network/sandbox/permission issues, explicitly ask for human intervention and wait for guidance/approval before retrying repeatedly.
- If a verification command is blocked by sandbox or permissions, ask the operator/human for approval to run that command outside the sandbox instead of assuming the verification is unnecessary.
- Dependency installation commands (for example `pnpm add`, `pnpm install`, `pnpm remove`) are allowed only after explicit user permission in the current task.
- `pnpm install` must be run by the human/operator; agents should only provide the exact command and wait for confirmation that installation is complete.
- After every medium or large code change, run `pnpm biome:fix:all` and typecheck before finalizing.
- Never state or imply that everything is correct without running the relevant tests; if verification is blocked, say exactly which tests were not run and why.
- For any agent-created commit, always follow `docs/commits.md` without exception; this rule applies to every commit message, commit split, and history rewrite performed by the agent.
- Always ask for explicit user permission before running Git write actions (for example `git commit`, `git rebase`, `git merge`, `git tag`).
- Never run `git push` unless the user explicitly asks for it; even when explicitly asked, ask for confirmation immediately before executing it.

## Code style rule for AI agents
- Use indentation equivalent to 4 spaces (2 tabs).
- Do not add code comments unless strictly necessary (for example, temporary placeholders).
- YAML files must use spaces for indentation (never tabs).
- Do not prefer quick fixes just because they are faster; choose the solution that best fits the documented architecture and improves long-term maintainability unless the user explicitly asks for a temporary workaround.
- Prefer one-line `if` statements when there is only a single throw statement (for example: `if (!order) throw new OrderNotFoundError();`).
- In domain-driven backend flows, prefer typed domain errors from `*.errors.ts` instead of inline/manual string errors, throw them from the domain/application layer, and map them to HTTP exceptions only at the presentation boundary.
- When a new business error appears, extend the module's domain `*.errors.ts` and reuse that type consistently across use-cases, controllers, and tests.
- Reusable auth failures (for example missing auth, invalid access token, insufficient permissions) must also use typed module errors and central HTTP mapping; keep direct Nest HTTP exceptions only for transport-boundary concerns such as schema/request validation.
- Avoid quick-fix type directives such as `/// <reference types=\"...\" />` for missing global types; prefer a proper project/package `tsconfig` fix (for example, `compilerOptions.types`) or explicit dependency configuration.
- Before adding new functions or utilities, first search the codebase for existing implementations and reuse/extend them when appropriate.
- Avoid bypassing existing abstractions with manual implementations (for example, do not read `process.env` directly in app/runtime code when `AppSettingsService`/config service is the project standard).
- Shared workspace packages must be consumed via package dependency + package exports entrypoints (for example `@packages/config/...`), never by importing `packages/*/src/*` from app code.

## HTTP validation rule for AI agents
- In `apps/api`, prefer request-boundary validation with Zod schemas plus `ZodValidationPipe` over TypeScript-only body/param/query types.
- Treat plain controller `type`/`interface` request bodies as compile-time only; they do not validate runtime input in Nest by themselves.
- For new or changed controller endpoints that accept `@Body()`, `@Param()`, or `@Query()`, add or reuse a Zod schema and apply it through `ZodValidationPipe` unless the endpoint truly has no input shape to validate.
- Prefer placing reusable request schemas in shared workspace packages when the contract is domain-level or reused across apps; otherwise keep them close to the API module boundary while still using package exports.
- Prioritize Zod boundary validation when the payload includes dates, numeric fields, enums/IDs, credentials, or other user-provided values that are later transformed or drive business decisions.
- Keep responsibility separation clear: `ZodValidationPipe` validates transport shape/basic field constraints; use-cases and domain entities enforce business rules and state transitions.
- Existing reference implementation: `apps/api/src/common/http/zod-validation.pipe.ts` used by `apps/api/src/modules/orders/presentation/orders.controller.ts` with `packages/shared/src/orders/create-order.schema.ts`.

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

3. Create a Draft PR linked to the issue before implementation.
   - Open it as soon as the branch exists and the issue scope is confirmed.
   - Link it to the issue using GitHub-closing syntax or the repository's preferred linked-issue format.
   - Assign it to `caiohenrqq` unless the user explicitly asks for a different assignee.
   - Add the relevant labels as soon as the scope is clear.
   - Keep the PR in draft until the implementation is ready for review and keep it scoped to the issue.

4. Create an implementation plan before coding.
   - The plan should match codebase standards and the current architecture.
   - Keep it practical and decision-complete enough for implementation.

5. Use TDD with focus on core behavior first.
   - Start with fail-first tests for the decision-heavy/core feature behavior.
   - Do not force micro-TDD for every trivial wiring change; prefer TDD around the core business rules and critical flows.
   - After fail-first tests, implement the minimum needed to pass.
   - Refactor after the core behavior is green.

6. Verify after coding.
   - Run targeted tests during implementation.
   - After every medium or large code change, run `pnpm biome:fix:all`.
   - Verify TypeScript/TSX syntax and type correctness before finalizing. If there is no dedicated typecheck script, run project-appropriate `tsc --noEmit` checks.

7. Update issue progress as work advances.
   - Do not leave issue checkboxes only for the end.
   - When a checklist item or done-when item is actually complete, update the GitHub issue and mark it checked.
   - If follow-up debt is discovered that should not block the issue, create or update a separate issue for it.

8. Maintain the PR using the repository template and keep unrelated local changes out of the issue PR unless the user explicitly asks.

9. Ask for confirmation at the right moments.
   - Ask before Git write actions that require user permission by project rule.
   - During TDD-driven issue work, ask for confirmation after each major phase when the user requested that workflow (for example: fail-first tests added, core implementation green, refactor/verification complete).

10. Check issue overlap before implementation when other issue work is active.
   - Identify the main modules, controllers, shared packages, and infrastructure points the issue is likely to touch before coding.
   - Check open issues and active branches/PRs for overlap in those same areas.
   - If overlap is substantial, call out the conflict risk, propose an execution order or dependency, and avoid parallel implementation in separate branches unless the user explicitly wants that risk.
   - Prefer landing refactors or shared-architecture changes before dependent feature work that would otherwise duplicate or conflict with those changes.

## Multi-agent issue workflow for AI agents
- When parallel issue work is needed, prefer one `git worktree` per issue/agent instead of sharing the same working directory across multiple agents.
- Keep the main repository as the coordination root, then create sibling worktrees for each active issue branch.
- Recommended naming pattern:
  - worktree path: `../workspaces/<issue-number>-<short-name>`
  - branch name: `<issue-number>-<short-name>`
- Preferred setup flow from the main repository root:
  1. Create or switch to the issue branch in a new worktree with `git worktree add <path> -b <branch>` when the branch does not exist yet.
  2. If the branch already exists, use `git worktree add <path> <branch>`.
  3. Prepare the worktree environment before coding or testing:
     - have the human run `pnpm install` inside the new worktree
     - ensure required local env files exist in the worktree; if they are local-only and missing, copy them from the main repository checkout before running commands
     - for the current test bootstrap, verify `apps/api/.env`, `apps/api/.env.test`, `apps/web/.env`, and `apps/workers/.env`
     - use `pnpm --filter api test:e2e -- <file>` for e2e files and `pnpm --filter api test:integration:db -- <file>` for DB-backed integration files instead of the generic `pnpm --filter api test -- <file>` entrypoint
     - run `pnpm -w db:generate` only if Prisma client artifacts are actually missing in the worktree
     - verify the worktree can execute at least one relevant narrow command before starting implementation
  4. Run all coding, tests, and issue-specific commands from inside that worktree, not from the main repository directory.
- Use the normal issue workflow above inside each worktree; `gh` remains the default tool for issue reading, Draft PR creation, issue linking, assignment, and labeling.
- Do not have multiple agents use the same worktree or the same checked-out branch at the same time.
- After the issue is merged or no longer active, remove the worktree with `git worktree remove <path>` instead of deleting the directory manually.
- If a branch is no longer needed after merge, delete it with the normal non-destructive Git flow only after confirming it is safe to do so.

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
- [x] Implement `User` domain logic and Prisma repository.
- [x] Create `SignUp` use-case with email confirmation placeholder.
- [ ] Create `Login` use-case with JWT and Refresh Token rotation.
- [ ] Implement `@Roles()` decorator and `AuthGuard` for RBAC.

### 2. Service Catalog & Pricing
- [ ] Implement Elo/Rank pricing engine (calculate subtotal based on rank difference).
- [ ] Implement deterministic pricing modifiers for all 10+ extras (FR-035 to FR-044).
- [ ] Create Zod schemas for order creation validation in `@packages/shared`.

### 3. Core Order Flow
- [x] Complete `CreateOrder` use-case with `OrderCredentials` persistence.
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

### 9. API request validation hardening
- [ ] Finish Zod + `ZodValidationPipe` coverage for Orders, Payments, and Wallet controller inputs still using compile-time-only request types.
- [ ] Evaluate parameter-level Zod validation for route params used as IDs (`orderId`, `paymentId`, `boosterId`) after body validation coverage is complete.
- [ ] Keep new request schemas in shared/domain packages only when reused; otherwise keep them module-local.
- [ ] Add or expand controller/integration coverage for accepted payloads and invalid-request `BadRequestException` mapping wherever boundary validation is introduced.

## Changelog
- Standardized reusable auth guard failures around typed auth errors with shared `401`/`403` HTTP mapping, while keeping transport-boundary validation exceptions explicit.
- Implemented the foundational Users module with pending-account sign-up, email-confirmation placeholder activation, Prisma-backed persistence, typed user errors, and API/e2e/DB coverage for the new auth entry flow.
- Clarified worktree bootstrap with the full env-file set currently needed for test setup and the correct API test commands for e2e and DB-backed integration files.
- Added an explicit rule that `pnpm install` must be run by the human/operator and agents should only provide the command.
- Added explicit worktree bootstrap instructions so new agent workspaces are prepared for install, env setup, Prisma generation, and test execution before coding starts.
- Added a conflict-prevention rule requiring issue overlap checks before implementation when other active issue work exists.
- Added a strict agent rule to prefer `gh` for GitHub operations whenever possible.
- Enforced a strict agent rule that all agent-created commits, including rewritten history, must always follow `docs/commits.md`.
- Bootstrapped the monorepo, core docs, Docker/dev scripts, and workspace-wide tooling (`pnpm`, Biome, env conventions, aliases, package boundaries).
- Built out the API modular structure across Orders, Payments, Wallet, Health, Config/Settings, Prisma persistence, and shared controller/error-mapping patterns with TDD-first coverage.
- Stabilized local/dev/runtime behavior around Docker watch mode, API bootstrap/restart flow, Prisma 7 runtime configuration, DB-backed test lanes, and test bootstrap scripts.
- Added roadmap-aligned backend features including order lifecycle completion, payment hold/webhook flows, wallet lock/withdrawal flows, authenticated order creation groundwork, and typed domain errors for business failures.
- Standardized agent workflow guidance around architecture-first changes, typed domain errors, Zod boundary validation, early Draft PR creation/linking/assignment, and multi-agent `git worktree` usage with `gh`.
- Tightened agent verification rules so sandbox-blocked test commands must be escalated to the operator/human for approval, and agents must never claim correctness without running the relevant tests or explicitly naming the blocked verification.
