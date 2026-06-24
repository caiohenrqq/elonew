# AGENTS

Repository rules for coding agents.

## Sources of truth

- Product behavior: `docs/requirements.md`
- Technical structure: `docs/architecture.md`
- Local workflow: `docs/development.md`
- Production operations: `docs/deployment.md`
- Logging: `docs/observability.md`
- Contribution workflow: `docs/contributing.md`

Read the relevant document fully before changing its subject.

## Working rules

- Start with read-only inspection.
- Make the smallest safe change.
- Preserve unrelated user changes.
- Reuse existing code before adding abstractions.
- Do not add speculative configuration, providers, packages, or layers.
- Never expose credentials, tokens, private keys, or production data.
- Never write to production data.
- Report exactly what was and was not verified.

## Tooling

- Use `pnpm`.
- Prefer the repository Docker workflow.
- Do not install host packages.
- Agents must not run `pnpm install`, `pnpm add`, or `pnpm remove`; provide the
  command for the human operator.
- Use existing package scripts. Check `package.json` before suggesting commands.
- Use `rg` for search and targeted checks before broad suites.

## Git

- Report the branch and dirty files before issue work.
- Do not start issue implementation on `main` unless the user explicitly asks.
- Ask before `git commit`, `git rebase`, `git merge`, or `git tag`.
- Never push unless explicitly requested and confirmed immediately before the
  push.
- Follow `docs/contributing.md`.

## Code

- Preserve package exports and declared workspace dependencies.
- Apps never import from `packages/*/src/*`.
- Runtime code uses config services instead of direct `process.env` access.
- Do not leave dead code, debug logs, or unused exports.
- Use Zod at changed HTTP input boundaries.
- Keep business rules in domain/application code, not controllers.
- Use typed domain errors and central HTTP mapping.
- Browser JavaScript never reads or writes JWTs.
- Workers remain idempotent and retry-safe.

## Database

- Inspect existing migration changes before editing `schema.prisma`.
- Change Prisma schema before generating a migration.
- The human runs `pnpm db:migrate:dev --name <name>`.
- Inspect generated SQL.
- Never edit an applied migration; add a corrective migration.
- Never run production write queries.

## Verification

For source changes, run:

- `pnpm biome:fix:all`
- relevant package typechecks
- targeted tests
- all applicable API, web, worker, integration, E2E, and database-backed suites
- affected builds

For docs-only changes, run `git diff --check`.

If a command cannot run, report the exact command, reason, and remaining risk.

## GitHub issues

Before issue implementation:

1. Read the issue, relevant docs, and existing code.
2. Check overlapping issues and pull requests.
3. Prepare a concrete plan.
4. Create an issue branch after scope is clear.
5. Keep the issue and PR accurate as work changes.

Use GitHub Issues for roadmap and follow-up work. Do not create roadmap
documents.
