# EloNew

EloNew is a monorepo for a League of Legends boosting platform.

## Structure

- `apps/api`: NestJS backend API
- `apps/web`: Next.js frontend
- `apps/workers`: background jobs runtime
- `packages/*`: shared packages (`shared`, `database`, `config`, `auth`, `ui`, `testing`, `integrations`)

## Documentation

- `docs/requirements.md`: product requirements
- `docs/tech-architecture.md`: technical architecture and design patterns
- `docs/database.md`: database guidelines
- `docs/stack.md`: stack overview
- `docs/commits.md`: commit conventions
- `AGENTS.md`: agent execution and project rules

## Quick start

```bash
pnpm install
pnpm docker:dev:down
pnpm docker:dev:up
pnpm docker:dev:logs
pnpm --filter api run start:dev
pnpm --filter web run dev
pnpm --filter @apps/workers run dev
```

When dependencies are added or changed with `pnpm install`, restart the Docker dev stack before continuing so the containers pick up the updated workspace state.
