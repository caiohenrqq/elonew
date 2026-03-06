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

until [ -f apps/api/dist/main.js ]; do
	sleep 0.2
done

node --watch --watch-path apps/api/dist apps/api/dist/main.js
