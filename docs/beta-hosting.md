# Beta Deployment

The beta uses:

- Vercel for `apps/web` at `https://elonew.com.br`;
- one VPS for the API, workers, PostgreSQL, Redis, and Cloudflare Tunnel;
- `https://api.elonew.com.br` as the public API and WebSocket origin.

## Cloudflare

Create a named tunnel and configure one public hostname:

```text
api.elonew.com.br -> http://api:3000
```

Save the tunnel token as `TUNNEL_TOKEN` in
`infrastructure/docker/prod/.env`.

The Compose stack publishes no host ports. Cloudflare Tunnel reaches the API
through the Docker `public-edge` network.

## VPS environment files

Create the ignored files from their templates:

```bash
cd infrastructure/docker/prod
cp .env.example .env
cp api.env.example api.env
cp workers.env.example workers.env
chmod 600 .env api.env workers.env
```

Use:

```text
PUBLIC_WEB_ORIGIN=https://elonew.com.br
PUBLIC_API_ORIGIN=https://api.elonew.com.br
```

`INTERNAL_API_KEY` must have the same value in `api.env` and `workers.env`.
Keep `SKIP_MERCADO_PAGO_CHECKOUT_IN_DEV_MODE=false`.

Generate local secrets with:

```bash
openssl rand -hex 32
openssl rand -base64 32
```

The base64 value is for `ORDER_CREDENTIALS_ENCRYPTION_KEY`. Do not commit any
environment file.

## Vercel

Import the repository and set the project root to `apps/web`.

Configure these production variables:

```text
NEXT_PUBLIC_APP_URL=https://elonew.com.br
NEXT_PUBLIC_API_URL=https://api.elonew.com.br
API_URL=https://api.elonew.com.br
WEB_SESSION_SECRET=<same value used by the API>
```

If cross-subdomain session cookies require it, also set:

```text
WEB_SESSION_COOKIE_DOMAIN=.elonew.com.br
```

Automatic Vercel Git deployments are disabled in `apps/web/vercel.json`.
Production is deployed only by the tag workflow.

## Production deployment

Add these GitHub Actions repository secrets:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
VPS_HOST
VPS_SSH_PRIVATE_KEY
VPS_KNOWN_HOSTS
```

`VPS_KNOWN_HOSTS` must contain the VPS SSH host key for port `22022`. The SSH
key must let `admin` access the VPS without a password.
The VPS repository must exist at `/opt/elonew/elonew`.

Pull requests targeting `main` run CI without creating Vercel previews. Direct
pushes to `main` trigger no GitHub Actions workflow. Production deploys only
from SemVer-style `v*` tags:

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

The tag must point to a commit contained in `main`. CI runs first, then the
workflow deploys that exact tag to the VPS and Vercel. The VPS stack applies
Prisma migrations before starting the API and workers.

Check it with:

```bash
docker compose --env-file infrastructure/docker/prod/.env \
  -f infrastructure/docker/prod/docker-compose.prod.yml ps
curl https://api.elonew.com.br/health
```

Data persists in the `elonew_postgres_prod_data` and
`elonew_redis_prod_data` volumes. Never use `docker compose down -v` unless
you intend to delete beta data and queued jobs.
