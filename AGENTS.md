# AGENTS

Global working agreements for Codex CLI in this repository workspace.

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

## Accuracy, recency, and sourcing (REQUIRED)

When a request depends on recency (for example: "latest", "current", "today", "as of now"):

1. Establish the current date/time and state it explicitly in ISO format.
   - Preferred command: `date -Is`
2. Prefer official or primary sources when researching.
   - Upstream vendor docs for any dependency, runtime, framework, cloud provider, or integration.
3. Prefer the most recent authoritative information.
   - Use the newest versioned docs, release notes, or changelogs.
   - Cross-check at least two reputable sources when details are safety-sensitive or compatibility-sensitive.

### Context7 MCP
- Use Context7 when you need library or API docs.
- If known, pin the library with slash syntax (for example `use library /supabase/supabase`).
- Mention the target version.
- Fetch only the minimal targeted docs needed and summarize them instead of dumping large excerpts.

### Web search policy
- Use web search only when it materially improves correctness.
- Prefer official docs and primary sources first; otherwise use Context7 MCP or reputable widely cited references.
- Record source dates when publish or release timing matters.

## Default autonomy and safety
- Default to read-only exploration and analysis first.
- When edits are needed, prefer workspace-scoped write access and keep changes inside the repo.
- When interacting with remote APIs, use read-only calls unless the user explicitly instructs otherwise.
- If the user requests a remote API write action, perform a dry run first when feasible.
- Never make destructive calls to remote APIs or production data sources.

### Editing files
- Make the smallest safe change that solves the issue.
- Preserve existing style and conventions.
- Prefer patch-style edits with small reviewable diffs over full-file rewrites.
- After making changes, run the project’s standard checks when feasible: format or lint, tests, build or typecheck.

### Reading project documents
- Read the full source document before responding.
- Draft the output.
- Before finalizing, re-read the original source and verify factual accuracy, no invented details, and style preservation unless the user explicitly asked for rewriting.
- If paraphrasing is required, label it explicitly as a paraphrase.

### Container-first policy (REQUIRED)
- Never install system packages on the host unless the user explicitly instructs it.
- Prefer container images to supply project tooling.
- For code projects and dependencies, use containers by default.
- If the repo already has a container workflow, follow it.
- If the repo has no container workflow, create a minimal one.
- Keep repo-specific container details in this file.

### Secrets and sensitive data
- Never print secrets such as tokens, private keys, or credentials to terminal output.
- Do not ask users to paste secrets.
- Avoid commands that may expose secrets, such as broad env dumps.
- Prefer existing authenticated CLIs and redact sensitive strings in displayed output.

## Baseline workflow
Start every task by determining:
1. Goal and acceptance criteria.
2. Constraints such as time, safety, and scope.
3. What must be inspected: files, commands, tests, docs.
4. Whether the request depends on recency. If yes, apply the rules above.
5. If requirements are ambiguous, ask targeted clarifying questions before making irreversible changes.

## CONTINUITY.md (REQUIRED)
Maintain a single continuity file for the current workspace: `.agent/CONTINUITY.md`.

- Read `.agent/CONTINUITY.md` at the start of each assistant turn before acting.
- Treat `.agent/CONTINUITY.md` as the canonical surviving briefing; do not rely on earlier chat or tool output unless it is reflected there.
- Update `.agent/CONTINUITY.md` only when there is a meaningful delta in one of these sections:
  - `[PLANS]`
  - `[DECISIONS]`
  - `[PROGRESS]`
  - `[DISCOVERIES]`
  - `[OUTCOMES]`

### File format
- Every entry must include:
  - an ISO timestamp
  - a provenance tag: `[USER]`, `[CODE]`, `[TOOL]`, or `[ASSUMPTION]`
- If something is unknown, write `UNCONFIRMED`.
- If something changes, supersede it explicitly instead of silently rewriting history.
- Do not record user-specific absolute filesystem paths in `.agent/CONTINUITY.md` (for example `/home/<user>`); prefer repo-relative paths or generic forms such as `~/.codex/...` when a path is necessary.

### Anti-drift / anti-bloat rules
- Facts only. No transcripts and no raw logs.
- Keep the file short, bounded, and high-signal.
- If sections become bloated, compress older items into `[MILESTONE]` bullets.

### Continuity vs changelog
- Use `.agent/CONTINUITY.md` for the current working state only: active plans, decisions, progress, discoveries, and outcomes that help the next agent continue the task safely.
- Use `.agent/CHANGELOG.md` for durable project history: meaningful landed changes that should remain discoverable after the current task is no longer active.
- Do not use `.agent/CONTINUITY.md` as a long-term project history file, and do not use `.agent/CHANGELOG.md` as a substitute for the current task brief.

## Repo-specific execution rules

### Documentation and dependency rules
- When documentation is needed, always use the official latest documentation.
- Do not modify auto-generated `package.json` dependency versions from framework scaffolds.
- Use `@latest` or `latest` only when manually adding or explicitly updating a dependency.

### Prisma migration rules
- Do not hand-write standalone SQL migration files by default.
- When a Prisma schema change requires a migration, update `schema.prisma` first and then ask the user to run `pnpm db:migrate:dev --name <migration_name>` manually.
- If a generated migration needs review, inspect the produced `migration.sql` after generation instead of prewriting it by hand.

### Command execution rules
- Prefer `pnpx` instead of `pnpm dlx` for one-off CLI execution.
- Prefer `gh` for GitHub operations whenever possible.
- If execution is blocked by network, sandbox, or permissions, ask for human intervention and wait for approval or guidance instead of retrying repeatedly.
- If a verification command is blocked by sandbox or permissions, ask the operator for approval to run it outside the sandbox.
- Dependency installation commands such as `pnpm add`, `pnpm install`, and `pnpm remove` require explicit user permission in the current task.
- `pnpm install` must be run by the human operator; agents should only provide the exact command and wait for confirmation.
- After every medium or large code change, run `pnpm biome:fix:all` and typecheck before finalizing.
- Never imply correctness without running the relevant verification. If verification is blocked, state exactly what was not run and why.
- For any agent-created commit, always follow `docs/commits.md`.
- Always ask for explicit user permission before Git write actions such as `git commit`, `git rebase`, `git merge`, and `git tag`.
- Never run `git push` unless the user explicitly asks for it. Even then, ask for confirmation immediately before executing it.

### Code style and architecture rules
- Use indentation equivalent to 4 spaces (2 tabs).
- Do not add code comments unless strictly necessary.
- YAML files must use spaces for indentation.
- Do not choose a quick fix just because it is faster; prefer the solution that best fits the documented architecture and long-term maintainability unless the user explicitly asks for a temporary workaround.
- Prefer ready seams over speculative wiring. Do not add future provider config, adapter methods, or abstractions unless the current issue needs them or the next committed step uses them immediately.
- Prefer one-line `if` statements when there is only a single throw statement.
- In domain-driven backend flows, prefer typed domain errors from `*.errors.ts` instead of inline or manual string errors.
- When a new business error appears, extend the module’s domain `*.errors.ts` and reuse that type consistently across use-cases, controllers, and tests.
- Reusable auth failures must also use typed module errors and central HTTP mapping. Keep direct Nest HTTP exceptions only for transport-boundary concerns such as schema or request validation.
- Avoid quick-fix type directives such as `/// <reference types=\"...\" />`; fix the relevant project or package `tsconfig` or dependency setup properly.
- Before adding new functions or utilities, search the codebase for existing implementations and reuse or extend them where appropriate.
- Avoid bypassing existing abstractions with manual implementations. For example, do not read `process.env` directly in runtime code when the project standard is `AppSettingsService` or shared config services.
- Shared workspace packages must be consumed via declared package dependency plus package exports entrypoints, never by importing `packages/*/src/*` from app code.
- Controller unit tests are not the default. Keep them only when they protect controller-specific behavior that is not already covered by use-case plus integration or e2e tests.

### HTTP validation rules
- In `apps/api`, prefer request-boundary validation with Zod schemas plus `ZodValidationPipe` over TypeScript-only body, param, or query types.
- Plain controller `type` or `interface` request bodies are compile-time only and do not validate runtime input in Nest.
- For new or changed controller endpoints that accept `@Body()`, `@Param()`, or `@Query()`, add or reuse a Zod schema and apply it through `ZodValidationPipe` unless the endpoint truly has no input shape to validate.
- Prefer placing reusable request schemas in shared workspace packages when the contract is domain-level or reused across apps; otherwise keep them close to the API module boundary while still using package exports.
- Prioritize Zod boundary validation when payloads include dates, numeric fields, enums or IDs, credentials, or other user-provided values that later drive business decisions.
- Keep responsibility separation clear: `ZodValidationPipe` validates transport shape and basic field constraints, while use-cases and domain entities enforce business rules and state transitions.
- Reference implementation: `apps/api/src/common/http/zod-validation.pipe.ts` used by `apps/api/src/modules/orders/presentation/orders.controller.ts` with `packages/shared/src/orders/create-order.schema.ts`.

## Issue execution workflow for AI agents
When the user says "let's start" on a GitHub issue or asks to begin issue work, follow this workflow by default.

### Phase 1: Inspect the issue before branching
1. Get the issue first and confirm the actual scope before any branch, worktree, or PR work.
   - Check the GitHub issue body.
   - Check `AGENTS.md` and the relevant docs under `docs/`.
   - Call out any conflict between the issue and the roadmap, architecture docs, or existing repo rules.
2. Review implementation overlap before committing to the approach.
   - Identify the main modules, controllers, shared packages, and infrastructure points the issue is likely to touch.
   - Check open issues and active branches or PRs for overlap in those same areas.
   - If overlap is substantial, call out the risk and propose an execution order or dependency.
3. Prepare the implementation plan before branch creation.
   - The plan should match codebase standards and current architecture.
   - Keep it practical and decision-complete enough for implementation.
   - Keep implementation aligned with the tracked issue body, not only with local architectural preference.

### Phase 2: Create the isolated working area
4. Create or switch to the issue branch only after the issue scope and plan are clear.
   - Before creating or switching to the issue branch, run `git fetch && git pull` so the local base branch is up to date.
   - Prefer a descriptive branch name tied to the issue number.
   - Do not start implementation on `main` unless the user explicitly asks for it.
   - After switching, keep all issue-related code changes on that active issue branch only.
5. For parallel issue work, prefer one `git worktree` per issue or agent.
   - Keep the main repository as the coordination root, then create sibling worktrees for each active issue branch.
   - Recommended naming pattern:
     - worktree path: `../workspaces/<issue-number>-<short-name>`
     - branch name: `<issue-number>-<short-name>`
   - Preferred setup flow from the main repository root:
     1. Create or switch to the issue branch in a new worktree with `git worktree add <path> -b <branch>` when the branch does not exist yet.
     2. If the branch already exists, use `git worktree add <path> <branch>`.
     3. Prepare the worktree environment before coding or testing:
        - Have the human run `pnpm install` inside the new worktree.
        - Ensure required local env files exist in the worktree. For the current test bootstrap, verify `apps/api/.env`, `apps/api/.env.test`, `apps/web/.env`, and `apps/workers/.env`.
        - Use `pnpm --filter api test:e2e -- <file>` for e2e files and `pnpm --filter api test:integration:db -- <file>` for DB-backed integration files instead of the generic `pnpm --filter api test -- <file>` entrypoint.
        - Run `pnpm -w db:generate` only if Prisma client artifacts are actually missing in the worktree.
        - Verify the worktree can execute at least one relevant narrow command before starting implementation.
     4. Run all coding, tests, and issue-specific commands from inside that worktree.
   - Do not have multiple agents use the same worktree or the same checked-out branch at the same time.
   - After the issue is merged or no longer active, remove the worktree with `git worktree remove <path>`.

### Phase 3: Open and maintain the issue PR
6. Create a Draft PR linked to the issue before implementation.
   - Open it as soon as the branch exists and the issue scope is confirmed.
   - Link it to the issue using GitHub-closing syntax or the repository’s preferred linked-issue format.
   - Assign it to `caiohenrqq` unless the user explicitly asks for someone else.
   - Add the relevant labels as soon as the scope is clear.
   - Keep it in draft until implementation is ready for review and keep it scoped to the issue.
7. Maintain the PR using the repository template and keep unrelated local changes out of the issue PR unless the user explicitly asks.
   - PR title must follow the exact Conventional Commit-style pattern: `<type>(<scope>): <description>`.
   - PR body must follow `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md` exactly, preserving the same section headings, order, checklist items, and `Closes: <issue link>` line.
   - PR labels must be set explicitly from the repository’s existing label set.
   - When updating an existing PR, normalize its title, body, and labels to the same standard instead of using ad hoc formats.

### Phase 4: Implement with TDD and keep issue state accurate
8. Use TDD with focus on core behavior first.
   - Start with fail-first tests for the decision-heavy or core feature behavior.
   - Do not force micro-TDD for every trivial wiring change.
   - After fail-first tests, implement the minimum needed to pass.
   - Refactor after the core behavior is green.
9. Keep issue progress and scope updated as work advances.
   - Do not leave issue checkboxes only for the end.
   - When a checklist item or done-when item is actually complete, update the GitHub issue and mark it checked.
   - If implementation choices narrow or expand the effective scope, update the GitHub issue text or checklists immediately.
   - If follow-up debt is discovered that should not block the issue, create or update a separate issue for it.
10. In payment, order, and auth flows, prioritize behavioral safety first.
   - Preserve or strengthen idempotency, duplicate protection, and ownership checks before adding future-facing scaffolding.
   - Add regression tests for the business rule being changed, not only for the new structure around it.

### Phase 5: Verify and close the loop
11. Verify after coding.
   - Run targeted tests during implementation.
   - After every medium or large code change, run `pnpm biome:fix:all`.
   - Verify TypeScript or TSX syntax and type correctness before finalizing. If there is no dedicated typecheck script, run an appropriate `tsc --noEmit` check.
12. Ask for confirmation at the right moments.
   - Ask before Git write actions that require user permission by project rule.
   - During TDD-driven issue work, ask for confirmation after each major phase when the user explicitly requested that workflow.

## Documentation maintenance rules
- After every medium or large change, add a brief summary entry to `.agent/CHANGELOG.md`.
- When a task in `## Development Roadmap` is completed, mark it with `[x]`.
- Documentation updates should be exhaustive for impacted areas before a task is considered done.

## Definition of done
A task is done when:
- the requested change is implemented or the question is answered
- verification is provided
- build is attempted when source code changed
- linting is run when source code changed
- errors or warnings are addressed, or explicitly listed and agreed as out of scope
- tests and typecheck are run as applicable
- documentation is updated for impacted areas
- impact is explained: what changed, where, and why
- follow-ups are listed if anything was intentionally left out
- `.agent/CONTINUITY.md` is updated if the change materially affected goal, state, or decisions

## Official docs
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
Moved to `.agent/CHANGELOG.md`.
