# Deployment

This document owns the production topology, configuration, release, rollback,
and operational commands.

## Topology

- Vercel serves `apps/web` at `https://elonew.com.br`.
- The VPS repository is `/opt/elonew/elonew`.
- Docker Compose runs API, workers, PostgreSQL, Redis, Alloy, migrations, and
  Cloudflare Tunnel.
- A lightweight cron container calls the internal stale-checkout reconciliation
  endpoint every 15 minutes.
- Cloudflare routes `api.elonew.com.br` to `http://api:3000`.
- PostgreSQL and Redis are private Docker services with persistent volumes.

## Production configuration

On the VPS:

```bash
cd /opt/elonew/elonew/infrastructure/docker/prod
cp .env.example .env
cp api.env.example api.env
cp workers.env.example workers.env
chmod 600 .env api.env workers.env
```

The same `INTERNAL_API_KEY` is required in `api.env` and `workers.env`.
Keep `SKIP_MERCADO_PAGO_CHECKOUT_IN_DEV_MODE=false` in production.
Set `STALE_CHECKOUT_RECONCILE_LIMIT` in `.env` only if the default batch size
of `50` is too small.

Vercel owns frontend environment variables:

```text
NEXT_PUBLIC_APP_URL=https://elonew.com.br
NEXT_PUBLIC_API_URL=https://api.elonew.com.br
API_URL=https://api.elonew.com.br
WEB_SESSION_SECRET=<same value used by the API>
WEB_SESSION_COOKIE_DOMAIN=.elonew.com.br
```

GitHub Actions requires:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
VPS_HOST
VPS_SSH_PRIVATE_KEY
VPS_KNOWN_HOSTS
```

## Release

Pushes and tags do not deploy. Publishing a stable GitHub Release runs CI and
deploys its exact tag:

```bash
git tag -a v0.2.0 -m "v0.2.0"
git push origin v0.2.0
gh release create v0.2.0 --generate-notes --verify-tag
```

Prereleases do not deploy:

```bash
gh release create v0.2.0-alpha.1 --prerelease --generate-notes --verify-tag
```

The workflow rejects tags whose commit is not contained in `main`, runs all CI
lanes, applies Prisma migrations, rebuilds the VPS stack, verifies API health,
and deploys the prebuilt frontend to Vercel.

## Verify

```bash
ssh elonew-vps
cd /opt/elonew/elonew
docker compose --env-file infrastructure/docker/prod/.env \
  -f infrastructure/docker/prod/compose.yml ps
curl https://api.elonew.com.br/health
curl --head https://elonew.com.br
```

## Logs

Use Grafana Cloud for API and worker logs. Local Docker logs remain the fallback:

```bash
pnpm docker:prod:logs
```

Useful LogQL:

```logql
{service_name=~"api|workers"}
{service_name="api"} |= "orders"
{service_name=~"api|workers"} | json | level >= 50
```

## Rollback

Application rollback is a new stable release pointing to a known-good commit.
Do not move or overwrite an existing release tag.

Database migrations are forward-only in production. If a migration cannot be
reversed safely, ship a corrective migration before or with the application
rollback.

## Data safety

Persistent volumes:

- `elonew_postgres_prod_data`
- `elonew_redis_prod_data`
- `elonew_alloy_prod_data`

Never run `docker compose down -v` unless deleting production data and queue
state is intentional.
