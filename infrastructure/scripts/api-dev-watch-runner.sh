#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

rm -rf apps/api/dist
pnpm -w config:build

pnpm --filter api exec nest build --watch &
BUILD_WATCH_PID=$!

cleanup() {
	kill "$BUILD_WATCH_PID" >/dev/null 2>&1 || true
}
trap cleanup INT TERM EXIT

API_MAIN_PATH="apps/api/dist/apps/api/src/main.js"

until [ -f "$API_MAIN_PATH" ]; do
	sleep 0.2
done

node --watch --watch-path apps/api/dist "$API_MAIN_PATH"
