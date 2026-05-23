# AI Dashboard Inspection With Playwright

This workflow lets an AI agent inspect authenticated dashboards through Playwright MCP or a Playwright e2e run. It uses the general development users from the shared `@packages/shared/testing/dev-users` fixture, which is also used by `apps/api/scripts/seed-dev-users.ts`.

## Prerequisites

- Development Docker services are running.
- The web app is available at `http://localhost:3001`.
- Development users are seeded with `pnpm db:seed:dev`.

If the seed command reports that the users already exist, that is fine.

## Seeded Accounts

All development accounts use the same password from `DEV_USER_PASSWORD`: `DevPassword123!`.

| Role | Email | Dashboard |
| --- | --- | --- |
| Admin | `admin@elojob.com` | `/admin` |
| Booster | `booster@elojob.com` | `/booster` |
| Client | `client@elojob.com` | `/client` |

## Playwright MCP Flow

Use the real login form so the application creates the same httpOnly session cookie a browser user receives.

1. Navigate to `http://localhost:3001/login`.
2. Fill `E-mail` with one of the seeded account emails.
3. Fill `Senha` with `DevPassword123!`.
4. Click `Entrar Agora`.
5. Wait for the role dashboard:
   - Admin: `http://localhost:3001/admin`
   - Booster: `http://localhost:3001/booster`
   - Client: `http://localhost:3001/client`

After login, the MCP browser can navigate within that role's dashboard and capture screenshots for UX/UI review.

## Verification Command

Run the focused e2e check to verify all three dashboards are visible with seeded credentials:

```bash
pnpm web test:e2e:ai-dashboard
```

The test captures full-page screenshots under:

```text
apps/web/test-results/ai-dashboard-inspection/
```

Those screenshots are generated artifacts and should not be committed.

Do not use `pnpm web test:e2e:report` in automation. It starts `playwright show-report`, which serves the HTML report until the process is interrupted.
