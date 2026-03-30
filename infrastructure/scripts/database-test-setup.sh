#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

set -a
source apps/api/.env.test
set +a

if [[ -n "${TEST_DB_NAME:-}" ]]; then
	export DATABASE_URL="${DATABASE_URL%/*}/${TEST_DB_NAME}"
fi

bash infrastructure/scripts/database-test-ensure-exists.sh
pnpm --filter @packages/database exec prisma migrate deploy
