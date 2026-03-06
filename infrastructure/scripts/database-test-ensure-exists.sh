#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="infrastructure/docker/dev/docker-compose.dev.yml"
DB_SERVICE="${TEST_DB_SERVICE:-database}"
DB_NAME="${TEST_DB_NAME:-elonew_test}"
DB_USER="${TEST_DB_USER:-postgres}"

if ! docker compose -f "$COMPOSE_FILE" ps --status running "$DB_SERVICE" >/dev/null 2>&1; then
	echo "Starting Docker service '$DB_SERVICE'..."
	docker compose -f "$COMPOSE_FILE" up -d "$DB_SERVICE"
fi

DB_EXISTS="$(docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
	psql -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")"

if [[ "$DB_EXISTS" != "1" ]]; then
	echo "Creating database '${DB_NAME}'..."
	docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
		psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME};"
else
	echo "Database '${DB_NAME}' already exists."
fi
