#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
	echo "Usage: $0 <jest-config> [jest args...]"
	exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
JEST_CONFIG="$1"
shift

cd "$REPO_ROOT"

set -a
source apps/api/.env.test
set +a

TEST_DB_NAME="${TEST_DB_NAME:-elonew_test_${PPID}_$$}"
DB_BASE_URL="${DATABASE_URL%/*}"

export TEST_DB_NAME
export DATABASE_URL="${DB_BASE_URL}/${TEST_DB_NAME}"

cleanup() {
	docker compose -f infrastructure/docker/dev/docker-compose.dev.yml exec -T "${TEST_DB_SERVICE:-database}" \
		psql -U "${TEST_DB_USER:-postgres}" -d postgres -v ON_ERROR_STOP=1 -c \
		"DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE);" >/dev/null 2>&1 || true
}

trap cleanup EXIT

pnpm -w config:build
pnpm -w auth:build
pnpm -w integrations:build
pnpm -w db:test:prepare
pnpm --filter api exec jest --config "$JEST_CONFIG" --runInBand -- "$@"
