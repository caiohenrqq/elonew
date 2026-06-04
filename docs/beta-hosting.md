# Beta Hosting (self-hosted via Cloudflare Tunnel)

How to expose a production-like build of the stack from your own machine to a
small group of trusted testers (2–5 people), behind a named Cloudflare Tunnel
with a Cloudflare Access email allowlist.

The whole stack runs from `infrastructure/docker/prod/`:
- `Dockerfile.prod` — multi-stage build that produces a single image containing
  the built API, web, and workers (one image, different commands per service).
- `docker-compose.prod.yml` — `database`, `redis`, a one-shot `migrate` job, `api`,
  `web`, `workers`, and `cloudflared`.

## How traffic flows

The browser talks to two public hostnames:
- `https://app.<domain>` → `web` (Next.js, port 3001) — the UI and BFF.
- `https://api.<domain>` → `api` (NestJS, port 3000) — REST plus the chat/notifications WebSocket.

`cloudflared` runs inside the compose network and reaches services by name
(`http://web:3001`, `http://api:3000`), so nothing is published to the host or
your router.

> Next.js inlines `NEXT_PUBLIC_*` at **build time**, so the public API/app URLs
> are baked into the web image. If you change a public hostname you must rebuild
> (`pnpm docker:prod:build`).

## One-time Cloudflare setup

Requires a domain managed by Cloudflare.

1. **Create the tunnel.** Zero Trust → Networks → Tunnels → Create a tunnel
   (type: Cloudflared). Name it (e.g. `elonew-beta`). On the install screen, copy
   the token shown after `--token` — that is `TUNNEL_TOKEN`.
2. **Add two public hostnames** to the tunnel:
   - `app.<domain>` → Service `HTTP` → `web:3001`
   - `api.<domain>` → Service `HTTP` → `api:3000`
   Cloudflare creates the DNS records automatically.
3. **Gate access.** Zero Trust → Access → Applications → Add a self-hosted app
   covering `app.<domain>` (and `api.<domain>` if you want the API gated too),
   with a policy that allows only your testers' emails (Include → Emails). Use
   the One-time PIN login method so testers don't need Cloudflare accounts.

## Environment files

All live in `infrastructure/docker/prod/` and are git-ignored (only the
`*.env.example` templates are committed).

```bash
cd infrastructure/docker/prod
cp .env.example .env
cp api.env.example api.env
cp web.env.example web.env
cp workers.env.example workers.env
```

Fill them in:

- **`.env`** — `POSTGRES_PASSWORD`, `PUBLIC_WEB_ORIGIN` (`https://app.<domain>`),
  `PUBLIC_API_ORIGIN` (`https://api.<domain>`), `WEB_SESSION_SECRET`, `TUNNEL_TOKEN`.
- **`api.env`** — the API secrets (production validation rejects the dev
  placeholders), Resend email settings, Mercado Pago credentials, and payment
  checkout settings. Keep `SKIP_MERCADO_PAGO_CHECKOUT_IN_DEV_MODE=false` for
  beta/prod so real Mercado Pago checkout is used.
- **`web.env`** — usually nothing; only an optional cookie domain.
- **`workers.env`** — usually nothing; optional tunables.

Generate fresh secrets:

```bash
openssl rand -hex 32      # JWT/email/internal-api/WEB_SESSION secrets
openssl rand -base64 32   # ORDER_CREDENTIALS_ENCRYPTION_KEY
```

`WEB_SESSION_SECRET` lives in `.env` and is injected into both `api` and `web`,
so it stays in sync automatically.

## Build and run

```bash
pnpm docker:prod:build   # build the image (rebuild after changing public origins)
pnpm docker:prod:up      # start the whole stack in the background
pnpm docker:prod:logs    # follow logs
pnpm docker:prod:down    # stop everything
```

Startup order is handled by health/readiness conditions: `database` and `redis`
come up first, the `migrate` job runs `prisma migrate deploy` and exits, then
`api`, then `web` and `workers`, then `cloudflared`.

Once healthy, send testers `https://app.<domain>`; they authenticate at the
Cloudflare Access screen first, then reach the app's normal login.

## Notes

- Data persists in the `elonew_postgres_prod_data` volume, separate from dev.
  `pnpm docker:prod:down -v` wipes it.
- Seed test accounts after the first start with
  `docker compose --env-file infrastructure/docker/prod/.env -f infrastructure/docker/prod/docker-compose.prod.yml exec api sh -lc 'pnpm --filter api seed:dev-users'`
  (only if you want the development users in the beta database).
- Workers run via `tsx` in this setup — fine for a small beta.
