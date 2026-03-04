# CODEX

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
- Always ask for explicit user permission before running Git write actions (for example `git commit`, `git rebase`, `git merge`, `git tag`).
- Never run `git push` unless the user explicitly asks for it; even when explicitly asked, ask for confirmation immediately before executing it.

## Code style rule for AI agents
- Use indentation equivalent to 4 spaces (2 tabs).
- Do not add code comments unless strictly necessary (for example, temporary placeholders).

Official docs to use:
- NestJS: https://docs.nestjs.com/
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Biome: https://biomejs.dev/
- pnpm: https://pnpm.io/installation
- TypeScript: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
