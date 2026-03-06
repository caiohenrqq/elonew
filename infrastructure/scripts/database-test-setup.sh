#!/usr/bin/env bash
set -euo pipefail

bash infrastructure/scripts/database-test-ensure-exists.sh
dotenv -e apps/api/.env.test -- pnpm --filter @packages/database exec prisma migrate deploy
