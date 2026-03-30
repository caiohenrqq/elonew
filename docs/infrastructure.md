# Infrastructure

## Scripts (`infrastructure/scripts`)

### `database-test-ensure-exists.sh`
- Purpose: ensure the test Postgres database exists before DB-backed tests.
- What it does:
	- checks if Docker service `database` is running in `infrastructure/docker/dev/docker-compose.dev.yml`
	- starts it if needed
	- checks if the selected test database exists
	- creates it when missing
- Optional env overrides:
	- `TEST_DB_SERVICE`
	- `TEST_DB_NAME`
	- `TEST_DB_USER`

### `database-test-setup.sh`
- Purpose: full setup for DB test lane.
- What it does:
	- loads `apps/api/.env.test`
	- if `TEST_DB_NAME` is provided, rewrites `DATABASE_URL` to that database
	- runs `database-test-ensure-exists.sh`
	- runs Prisma migrations on test env:
		- `pnpm --filter @packages/database exec prisma migrate deploy`
- Used by root script:
	- `pnpm db:test:prepare`

### `api-db-test-runner.sh`
- Purpose: execute API DB-backed Jest lanes against an isolated per-run Postgres database.
- What it does:
	- loads `apps/api/.env.test`
	- derives a unique `TEST_DB_NAME` when one is not provided
	- rewrites `DATABASE_URL` to the isolated database
	- runs workspace builds plus `db:test:prepare`
	- runs the requested API Jest config in-band
	- drops the isolated database on exit

### `api-dev-watch-runner.sh`
- Purpose: stable API hot-reload runtime for Docker dev.
- What it does:
	- clears `apps/api/dist`
	- builds shared config package once (`pnpm -w config:build`)
	- starts `nest build --watch` in background
	- waits for `apps/api/dist/main.js`
	- runs Node watcher on emitted JS:
		- `node --watch --watch-path apps/api/dist apps/api/dist/main.js`
- Why this exists:
	- avoids port-collision instability seen with `nest start --watch` in Docker polling setups.
- Used by API script:
	- `pnpm --filter api run start:dev:stable`
