# Development

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/api/.env.example apps/api/.env.test
cp apps/web/.env.example apps/web/.env
cp apps/workers/.env.example apps/workers/.env
pnpm docker:dev:up
```

The development stack exposes:

- web: `http://localhost:3001`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Use `pnpm docker:dev:logs` for container logs and
`pnpm docker:dev:down` when finished.

## Commands

```bash
pnpm build
pnpm biome:check:all
pnpm api test
pnpm api test:integration:db
pnpm api test:e2e
pnpm web test
pnpm web test:e2e
pnpm workers test
pnpm db:generate
pnpm db:validate
pnpm db:migrate:dev --name <migration_name>
pnpm db:seed:dev
```

`package.json` files are the command source of truth. Do not maintain a second
complete command catalog in documentation.

## Database tests

`scripts/api-db-test.sh` creates an isolated PostgreSQL database, applies
migrations, runs one Jest lane, and drops the database on exit.

`scripts/database-test-setup.sh` ensures the selected test database exists and
applies migrations. Both scripts use `apps/api/.env.test`.

## API Docker watch

`scripts/api-dev-watch.sh` builds shared packages, runs the Nest compiler in
watch mode, and restarts emitted JavaScript with Node's watcher. This avoids
overlapping Nest listeners in Docker polling environments.

## Dashboard inspection

1. Start the Docker development stack.
2. Run `pnpm db:seed:dev`.
3. Run `pnpm web test:e2e:ai-dashboard`.

The focused Playwright test signs in with shared development fixtures and writes
screenshots to `apps/web/test-results/ai-dashboard-inspection/`. Generated test
artifacts are ignored.
