#!/bin/sh
set -eu

: "${INTERNAL_API_KEY:?set INTERNAL_API_KEY}"
: "${API_INTERNAL_BASE_URL:=http://api:3000}"
: "${STALE_CHECKOUT_RECONCILE_LIMIT:=50}"

wget -qO- \
	--header "x-internal-api-key: ${INTERNAL_API_KEY}" \
	--header 'content-type: application/json' \
	--post-data "{\"limit\":${STALE_CHECKOUT_RECONCILE_LIMIT}}" \
	"${API_INTERNAL_BASE_URL}/payments/internal/reconcile-stale-checkouts"
printf '\n'
