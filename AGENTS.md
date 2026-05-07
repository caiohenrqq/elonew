# AGENTS

Global working agreements for Codex CLI in this repository workspace.

## Project summary

Monorepo for a League of Legends boosting platform with:
- `apps/api` for the NestJS backend.
- `apps/web` for the Next.js frontend.
- `apps/workers` for background jobs.
- `packages/*` for shared libraries:
  - `shared`
  - `database`
  - `config`
  - `auth`
  - `ui`
  - `testing`
  - `integrations`

## Source of truth

Use these documents as the main reference before changing architecture, product behavior, database rules, package decisions, commit behavior, or implementation patterns:
- Product requirements: `docs/requirements.md`
- Technical architecture and structure: `docs/tech-architecture.md`
- Database guidelines: `docs/database.md`
- Stack decisions: `docs/stack.md`
- Package management: `docs/packages.md`
- Commit rules: `docs/commits.md`

## Core principles

- Use only the tools necessary for the current task.
- Prefer small, safe, reviewable changes.
- Preserve existing style and conventions.
- Do not add speculative abstractions.
- Do not choose a quick fix only because it is faster.
- Prefer long-term maintainability when it does not conflict with the issue scope.
- Do not make unrelated changes.
- Do not expose secrets, credentials, tokens, private keys, or production data.
- Never make destructive calls to remote APIs or production data sources.
- Never imply correctness without verification.
- If verification is blocked, state exactly what was not run and why.

## Tool and context budget

Use the smallest amount of context and tooling that can safely solve the task.

- Before reading files, decide what evidence is needed.
- For small fixes, inspect only directly related files.
- For architecture changes, inspect the source-of-truth docs and affected modules.
- For frontend UI verification, use browser tools only when visual behavior matters.
- For dependency, runtime, framework, or cloud behavior, use official docs when current behavior matters.
- For current or version-sensitive information, verify against official sources.
- Do not dump large file contents into responses.
- Prefer targeted exploration:
  - Use `rg` before opening many files.
  - Use narrow tests before full test suites.
  - Use targeted typecheck/build commands when available.
- Stop exploring once the acceptance criteria can be answered or implemented safely.

## Accuracy, recency, and sourcing

When a request depends on recency, for example "latest", "current", "today", or "as of now":
- Establish the current date and time.
- Preferred command: `date -Is`.
- Prefer official or primary sources:
  - framework docs
  - runtime docs
  - vendor docs
  - release notes
- Prefer the newest authoritative versioned information.
- Cross-check at least two reputable sources when details are safety-sensitive, compatibility-sensitive, or migration-sensitive.

### Context7 MCP

Use Context7 when library or API documentation is needed.

Rules:
- Use it only when it materially improves correctness.
- If known, pin the library with slash syntax, for example `use library /supabase/supabase`.
- Mention the target version.
- Fetch only the minimal targeted docs needed.
- Summarize the relevant information instead of dumping long excerpts.

### Web search policy

Use web search only when it materially improves correctness.

Prefer this order:
1. Official docs.
2. Primary sources.
3. Context7 MCP.
4. Reputable widely cited references.

Record source dates when publish dates, release dates, or compatibility windows matter.

## Default safety

- Start with read-only exploration.
- When edits are needed:
  - Keep changes inside the repository.
  - Prefer workspace-scoped write access.
  - Prefer patch-style edits with small diffs.
  - Avoid full-file rewrites unless the file is mostly generated, broken, explicitly being replaced, or the task is a document refactor.
- When interacting with remote APIs:
  - Use read-only calls unless the user explicitly instructs otherwise.
  - For remote write actions, perform a dry run first when feasible.
  - Never run destructive remote actions.

## Secrets and sensitive data

- Never print secrets, tokens, private keys, credentials, or session values.
- Do not ask users to paste secrets.
- Avoid broad environment dumps.
- Redact sensitive strings in displayed output.
- Prefer existing authenticated CLIs over manual credential handling.
- Do not include production customer data in examples, logs, commits, PRs, or screenshots.

## Container-first policy

Prefer containers for project tooling and local services.

Rules:
- Never install system packages on the host unless the user explicitly asks.
- For code projects and dependencies, use containers by default.
- If the repo already has a container workflow, follow it.
- If the repo has no container workflow, create or propose a minimal one.
- Keep repo-specific container details in this file.
- Before starting any local frontend or full-stack dev server, check the Docker workflow first.
- When Docker access is available, run:

```bash
docker compose -f infrastructure/docker/dev/docker-compose.dev.yml ps
```

- If the `web` service is already running, use `http://localhost:3001`.
- If the needed service is not running, prefer `pnpm docker:dev:up`.
- Do not start another host-level dev server unless the user explicitly asks.

## Package management

- Use the project package manager, `pnpm`.
- Do not modify auto-generated `package.json` dependency versions from framework scaffolds.
- Use `@latest` or `latest` only when manually adding or explicitly updating a dependency.
- Dependency installation commands require explicit user permission:
  - `pnpm install`
  - `pnpm add`
  - `pnpm remove`
- `pnpm install` must be run by the human operator.
- Agents should provide the exact command and wait for confirmation when install is required.
- Prefer `pnpx` instead of `pnpm dlx` for one-off CLI execution.

## Verified workspace scripts

These commands are verified against current workspace `package.json` files.

- Check the relevant `package.json` before suggesting or running a verification command.
- Do not invent scripts. If a script does not exist, use the underlying explicit command and say it is not a package script.

Root aliases:
- `pnpm api`
- `pnpm web`
- `pnpm workers`

Formatting and checks:
- `pnpm biome:check:all`
- `pnpm biome:fix:all`

Builds:
- `pnpm build`
- `pnpm build:packages`
- `pnpm api build`
- `pnpm web build`

Development:
- `pnpm dev:api`
- `pnpm dev:web`
- `pnpm dev:workers`
- `pnpm docker:dev:up`
- `pnpm docker:dev:down`
- `pnpm docker:dev:logs`

Tests:
- `pnpm api test`
- `pnpm api test:unit`
- `pnpm api test:integration`
- `pnpm api test:e2e -- <file>`
- `pnpm api test:integration:db -- <file>`
- `pnpm web test`
- `pnpm web test:e2e`
- `pnpm workers test`

Database:
- `pnpm db:generate`
- `pnpm db:validate`
- `pnpm db:migrate:dev --name <migration_name>`
- `pnpm db:migrate:deploy`
- `pnpm db:test:prepare`
- `pnpm db:seed:dev`

Type correctness:
- There is no root `typecheck` script right now.
- When typechecking is needed, use an explicit package command, for example:
  - `pnpm api exec tsc --noEmit -p tsconfig.json`
  - `pnpm web exec tsc --noEmit -p tsconfig.json`
- Do not present these as package scripts unless scripts are added later.

## Baseline workflow

For every task:
1. Identify the goal and acceptance criteria.
2. Identify constraints such as safety, scope, current branch, and required verification.
3. Inspect only the files, docs, commands, or external sources needed for the goal.
4. Check whether recency matters.
5. Make the smallest safe change.
6. Run the smallest relevant quality gate.
7. Report:
   - what changed
   - where it changed
   - why it changed
   - what was verified
   - what was not verified, if anything
   - follow-ups, if any

Ask clarifying questions only when missing information would make the task unsafe, destructive, or likely wrong.

For issue work, report the current branch and dirty files before making changes.

## Reading project documents

When a task depends on a source document:
- Read the full relevant source document before responding or editing.
- Draft the output or change.
- Re-check the source document before finalizing.
- Verify there are no invented details.
- Preserve the original meaning and style unless the user explicitly asked for rewriting.
- If paraphrasing is required, label it as a paraphrase.

## Editing files

- Make the smallest safe change that solves the issue.
- Preserve existing style and conventions.
- Prefer patch-style edits with small reviewable diffs.
- Avoid full-file rewrites unless explicitly requested or the task is a document refactor.
- Search for existing implementations before adding a new function, utility, provider, or abstraction.
- Reuse or extend existing patterns.
- Do not bypass existing abstractions.
- Do not add comments unless strictly necessary.
- Do not leave dead code, debug logs, or unused exports.

## Command execution rules

- Prefer targeted commands over broad commands.
- Prefer `gh` for GitHub operations whenever possible.
- If execution is blocked by network, sandbox, or permissions, ask for human intervention instead of retrying repeatedly.
- If a verification command is blocked by sandbox or permissions, ask the operator for approval to run it outside the sandbox.
- Never imply a check passed unless it was actually run.
- For any agent-created commit, follow `docs/commits.md`.
- Always ask for explicit user permission before Git write actions:
  - `git commit`
  - `git rebase`
  - `git merge`
  - `git tag`
- Never run `git push` unless the user explicitly asks.
- If the user asks for `git push`, ask for confirmation immediately before executing it.

## Code style and architecture rules

- Use indentation equivalent to 4 spaces, represented as 2 tabs where tabs are used.
- YAML files must use spaces for indentation.
- Prefer one-line `if` statements when there is only a single throw statement.
- Avoid quick-fix type directives such as `/// <reference types="..." />`.
- Fix the relevant project, package `tsconfig`, or dependency setup properly.
- Shared workspace packages must be consumed through declared package dependencies and package export entrypoints.
- Never import from `packages/*/src/*` directly in app code.
- Do not read `process.env` directly in runtime code when the project standard is `AppSettingsService` or shared config services.
- Prefer ready seams over speculative wiring.
- Do not add future provider config, adapter methods, or abstractions unless the current task needs them or the next committed step uses them immediately.

## Backend rules

### Domain and application flow

- Keep business behavior in domain entities, domain services, or use-cases.
- Keep controllers focused on transport concerns.
- Prefer typed domain errors from `*.errors.ts`.
- When a new business error appears, extend the module's domain `*.errors.ts`.
- Reuse typed errors consistently across:
  - use-cases
  - controllers
  - tests
  - HTTP mapping
- Reusable auth failures must use typed module errors and central HTTP mapping.
- Keep direct Nest HTTP exceptions only for transport-boundary concerns such as request validation.

### Controller tests

- Controller unit tests are not the default.
- Keep them only when they protect controller-specific behavior that is not already covered by:
  - use-case tests
  - integration tests
  - e2e tests

### HTTP validation

In `apps/api`, prefer request-boundary validation with Zod schemas plus `ZodValidationPipe`.

Rules:
- Plain controller `type` or `interface` request bodies are compile-time only and do not validate runtime input.
- For new or changed controller endpoints that accept `@Body()`, `@Param()`, or `@Query()`, add or reuse a Zod schema.
- Apply validation through `ZodValidationPipe` unless the endpoint truly has no input shape to validate.
- Prefer reusable request schemas in shared workspace packages when the contract is domain-level or reused across apps.
- Otherwise, keep schemas close to the API module boundary.
- Prioritize Zod boundary validation when payloads include:
  - dates
  - numeric fields
  - enums
  - IDs
  - credentials
  - user-provided values that drive business decisions
- `ZodValidationPipe` validates transport shape and basic field constraints.
- Use-cases and domain entities enforce business rules and state transitions.

Reference implementation:
- `apps/api/src/common/http/zod-validation.pipe.ts`
- `apps/api/src/modules/orders/presentation/orders.controller.ts`
- `packages/shared/src/orders/create-order.schema.ts`

## Frontend rules

- Keep route folders thin.
- Route files should compose feature code instead of containing heavy logic.
- Prefer feature modules under `src/modules`.
- Keep common reusable code under `src/shared`.
- Respect the server/client boundary.
- Mark client components with `'use client'` only when needed.
- Browser JavaScript must not read or write JWTs directly.
- Server Actions, Route Handlers, and Server Components may read httpOnly cookies and call backend services.
- Client components should call BFF endpoints when sensitive tokens are involved.
- Use the project's form, validation, and data-fetching standards.
- Playwright is required when user-visible frontend flows change.

## Prisma and database rules

- Do not hand-write standalone SQL migration files by default.
- Before changing `schema.prisma`, check whether existing migration files are dirty or modified. If any existing migration file is modified, stop and ask the user before continuing.
- When a database is available, run a read-only migration health check before generating a new Prisma migration. Prefer `pnpm db migrate status`; if it reports drift, checksum mismatch, or unapplied local history problems, stop and report the exact issue before editing further.
- When a Prisma schema change requires a migration:
  1. Update `schema.prisma` first.
  2. Ask the user to run `pnpm db:migrate:dev --name <migration_name>`.
  3. Inspect the generated `migration.sql` after generation.
- Use descriptive snake_case migration names, for example `add_admin_governance_actions`.
- Never edit an already-applied Prisma migration. If an applied migration is wrong, create a new corrective migration or ask the user to choose a migration-history repair path.
- Do not edit SQL files generated by Prisma unless the user explicitly asks for a generated migration repair after review.
- Consider data integrity, uniqueness, rollback risk, and existing production behavior before changing database constraints.
- Do not run production write queries.
- Do not expose production customer data.

## Quality gates

Before finalizing any code task, pass the smallest relevant quality gate.

If a command cannot be run, report:
- the exact command that was not run
- why it was not run
- what risk remains

Always required:
- Code follows project conventions.
- No unrelated changes.
- No secrets or sensitive data exposed.
- No speculative abstractions.
- Existing architecture and source-of-truth docs were respected.
- Changed files are explained.
- Verification is reported honestly.

### Backend changes

Run or report why you could not run:
- `pnpm biome:fix:all`
- a relevant typecheck command, such as `pnpm api exec tsc --noEmit -p tsconfig.json`
- targeted tests for the changed behavior

Use integration or e2e tests when behavior crosses:
- HTTP
- database
- queues
- auth
- payments
- external integrations

Required backend checks:
- Runtime input validation exists for new or changed controller inputs.
- Business rules are not implemented only in controllers.
- Domain errors are typed and reused.
- Idempotency is preserved when relevant.
- Duplicate protection is preserved when relevant.
- Ownership and authorization checks are preserved when relevant.
- Database changes preserve data integrity.

### Frontend changes

Run or report why you could not run:
- `pnpm biome:fix:all`
- a relevant typecheck command, such as `pnpm web exec tsc --noEmit -p tsconfig.json`
- component or unit tests for changed logic
- Playwright tests when user-visible flows changed

Required frontend checks:
- Server/client boundary is respected.
- Sensitive tokens are not exposed to browser JavaScript.
- Forms validate with the project standard.
- Loading, empty, and error states are handled when relevant.
- Screenshots or manual validation notes are included for UI changes.

### Worker changes

Run or report why you could not run:
- `pnpm biome:fix:all`
- targeted worker tests, such as `pnpm workers test`

Required worker checks:
- Job idempotency is preserved.
- Retry behavior is considered.
- Duplicate execution is safe or explicitly handled.
- Queue names and payload schemas follow existing conventions.

### Shared package changes

Run or report why you could not run:
- `pnpm biome:fix:all`
- tests for affected packages or consumers
- a relevant package build, such as `pnpm build:packages`

Required shared package checks:
- Public exports are intentional.
- Breaking changes are documented.
- Apps consume the package through declared dependencies and exports.
- No app imports directly from `packages/*/src/*`.

### Database changes

Required database checks:
- Prisma schema is changed before migration generation.
- Generated migration SQL is inspected after generation.
- Uniqueness and foreign-key behavior are intentional.
- Data migration risk is explained.
- Rollback or recovery concerns are mentioned when relevant.

### Documentation changes

Required documentation checks:
- Impacted docs are updated when behavior, workflow, architecture, or commands change.
- Completed roadmap items are marked with `[x]` when applicable.
- For docs-only refactors, run `git diff --check`.
- For docs-only tasks, `git diff --check` is enough unless formatting, linting, or broader verification is explicitly requested.

## Git workflow

- Do not start implementation on `main` unless the user explicitly asks.
- Before creating or switching branches for issue work, update the local base branch:

```bash
git fetch && git pull
```

- Prefer descriptive branch names tied to the issue number.
- Keep issue-related changes on the active issue branch only.
- Always ask before Git write actions.
- Never push unless explicitly asked and confirmed.

## GitHub issue workflow

When the user says "let's start" on a GitHub issue or asks to begin issue work, use this workflow.

### Phase 1: Inspect

- Get the issue first.
- Report the current branch and dirty files before branch, worktree, or implementation changes.
- Confirm the actual scope before creating a branch, worktree, or PR.
- Check:
  - GitHub issue body
  - `AGENTS.md`
  - relevant docs under `docs/`
  - existing code
- Call out conflicts between:
  - issue body
  - roadmap
  - architecture docs
  - existing repo rules
- Check for overlap with open issues, active branches, or PRs.
- Prepare a practical implementation plan before branch creation.

### Phase 2: Branch or worktree

- Create or switch to the issue branch only after scope and plan are clear.
- For parallel issue work, prefer one git worktree per issue or agent.
- Recommended worktree pattern: `../workspaces/<issue-number>-<short-name>`.
- Recommended branch pattern: `<issue-number>-<short-name>`.
- Preferred setup from repository root:
  - `git worktree add <path> -b <branch>` when the branch does not exist.
  - `git worktree add <path> <branch>` when the branch already exists.
- After creating a worktree:
  - Ask the human to run `pnpm install` inside the worktree.
  - Verify required local env files exist:
    - `apps/api/.env`
    - `apps/api/.env.test`
    - `apps/web/.env`
    - `apps/workers/.env`
  - Use `pnpm api test:e2e -- <file>` for API e2e files.
  - Use `pnpm api test:integration:db -- <file>` for DB-backed API integration files.
  - Run `pnpm db:generate` only if Prisma client artifacts are actually missing.
  - Verify at least one relevant narrow command before implementation.
- Run all issue-specific commands from inside that worktree.
- Do not let multiple agents use the same worktree or checked-out branch at the same time.
- After the issue is merged or inactive, remove the worktree with `git worktree remove <path>`.

### Phase 3: Draft PR

- Create a Draft PR after the branch exists and issue scope is confirmed.
- Link the issue using GitHub closing syntax.
- Assign it to `caiohenrqq` unless the user asks otherwise.
- Add relevant labels from the existing repository label set.
- Keep it in draft until ready for review.
- Keep it scoped to the issue.
- PR title must follow `<type>(<scope>): <description>`.
- PR body must follow `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`.
- When updating an existing PR, normalize title, body, and labels to repository standards.

Useful GitHub commands:
- Inspect issue: `gh issue view <issue-number> --json number,title,body,url,labels,assignees,state`
- List open PRs: `gh pr list --state open --json number,title,headRefName,baseRefName,labels,url`
- Inspect PR: `gh pr view <pr-number> --json number,title,body,url,headRefName,baseRefName,isDraft,labels,assignees`
- Create draft PR: `gh pr create --draft --base main --head <branch> --title "<type>(<scope>): <description>" --body-file <file> --assignee caiohenrqq --label <label>`

### Phase 4: Implement

- Use TDD where it provides value.
- Start with fail-first tests for decision-heavy or core behavior.
- Do not force micro-TDD for trivial wiring.
- Implement the minimum needed to pass.
- Refactor after the core behavior is green.
- Keep issue checkboxes updated as work advances.
- If implementation narrows or expands scope, update the issue text or checklist.
- If follow-up debt should not block the issue, create or update a separate issue.

For payment, order, and auth flows:
- Preserve or strengthen idempotency.
- Preserve duplicate protection.
- Preserve ownership checks.
- Add regression tests for changed business rules.

### Phase 5: Verify

- Run targeted tests.
- Run the relevant quality gate.
- Run `pnpm biome:fix:all` after medium or large code changes.
- Verify TypeScript or TSX correctness.
- If there is no dedicated typecheck script, run an explicit `tsc --noEmit` command for the affected package.
- Report skipped checks clearly.

## Pull request rules

PRs must be simple, reviewable, and honest.

Rules:
- Use the repository PR template exactly.
- Keep the Summary short.
- Keep Changes factual.
- Paste actual verification commands.
- Mark skipped checks clearly in Notes.
- Add screenshots only for UI changes.
- Put `None.` under Breaking Changes when there are no breaking changes.

## Documentation maintenance

- After every medium or large change, update impacted docs.
- Mark completed roadmap items with `[x]`.
- Documentation updates should be complete for impacted areas before the task is considered done.

## Definition of done

A task is done when:
- The requested change is implemented or the question is answered.
- The smallest relevant quality gate passed.
- Verification commands were run, or skipped with a clear reason.
- Build or typecheck was attempted when source code changed.
- Linting or formatting was run when source code changed.
- Tests were run when behavior changed.
- Documentation was updated when behavior, commands, or architecture changed.
- Impact is explained:
  - what changed
  - where it changed
  - why it changed
- Follow-ups are listed if anything was intentionally left out.

## Official docs

Use official docs first when documentation is required.

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
- [x] Create `Login` use-case with JWT and Refresh Token rotation.
- [ ] Implement `@Roles()` decorator and `AuthGuard` for RBAC.

### 2. Service Catalog & Pricing
- [x] Implement Elo/Rank pricing engine (calculate subtotal based on rank difference).
- [ ] Implement deterministic pricing modifiers for all 10+ extras (FR-035 to FR-044).
- [x] Create Zod schemas for order creation validation in `@packages/shared`.

### 3. Core Order Flow
- [x] Complete `CreateOrder` use-case with `OrderCredentials` persistence.
- [x] Implement `AcceptOrder` and `RejectOrder` logic for boosters.
- [x] Implement `CancelOrder` with business rules (allow only before acceptance).
- [x] Implement `CompleteOrder` with automated credential deletion logic.

### 4. Payments Integration (Mercado Pago)
- [x] Build `@packages/integrations/mercadopago` wrapper.
- [x] Implement `HandleWebhook` use-case with idempotency (using `ProcessedWebhookEvent`).
- [x] Map Mercado Pago states to internal `PaymentStatus` and trigger order transitions.

### 5. Booster Wallet & Finances
- [x] Implement `Wallet` domain logic for Credit/Debit ledger entries.
- [x] Create `WithdrawalRequest` flow for boosters.
- [x] Build background worker (BullMQ) for "Lock Period" timer to release funds.

### 6. Communication & Support
- [ ] Implement WebSocket gateway for real-time internal Chat.
- [ ] Create `Ticket` domain and use-cases for support history.
- [ ] Add `Rating` system (Client rates Booster and vice-versa).

### 7. Admin Governance
- [x] Implement Admin Dashboard API (Financial metrics: Revenue, active orders).
- [x] Create endpoints for Admin intervention (Force cancel, user block/unblock).

### 8. Frontend implementation (Next.js)
- [x] Build shared component library in `@packages/ui`.
- [x] Implement Client Dashboard (Order creation, active order tracking).
- [x] Implement Booster Dashboard (Available orders queue, wallet management).
- [x] Implement Admin Dashboard (Metric overview, user management, support view).

### 9. API request validation hardening
- [ ] Finish Zod + `ZodValidationPipe` coverage for Orders, Payments, and Wallet controller inputs still using compile-time-only request types.
- [ ] Evaluate parameter-level Zod validation for route params used as IDs (`orderId`, `paymentId`, `boosterId`) after body validation coverage is complete.
- [ ] Keep new request schemas in shared/domain packages only when reused; otherwise keep them module-local.
- [ ] Add or expand controller/integration coverage for accepted payloads and invalid-request `BadRequestException` mapping wherever boundary validation is introduced.
