# plan_create_dashboard_admin.md

## Summary

Implement issue `#60` as a full-stack Admin Dashboard slice covering admin metrics, user governance, force-cancel order intervention, read-only support visibility, and the Next.js admin workspace.

The implementation should keep backend authorization as the source of truth, use honest unavailable/empty UI states instead of fake production data, and avoid broad lifecycle overrides beyond the agreed MVP action: admin force-cancel with an audit reason.

## Key Changes

- Add an `admin` backend module in `apps/api` for admin-only read and governance use cases.
- Add `GET /admin/metrics` for all-time revenue, total orders, active orders, and active users.
- Add `GET /admin/users`, `POST /admin/users/:userId/block`, and `POST /admin/users/:userId/unblock`.
- Add `GET /admin/orders` and `POST /admin/orders/:orderId/force-cancel` with a required reason.
- Add `GET /admin/support/tickets` for read-only ticket summaries and history visibility.
- Add Zod validation for admin params, queries, and body payloads.
- Extend persistence with user block state and an admin governance/audit action model.
- Add `/admin` in `apps/web` with admin-only routing, overview, users, orders, support views, API-backed server reads, and no fake production data.
- Update admin login/start redirects to `/admin`.

## Interfaces / Types

- Metrics response: `revenueTotal`, `ordersTotal`, `activeOrders`, `activeUsers`.
- Users response: `id`, `username`, `email`, `role`, `isActive`, `isBlocked`, `createdAt`.
- Orders response: `id`, `status`, `serviceType`, `clientId`, `boosterId`, `totalAmount`, `createdAt`, plus latest governance context when available.
- Support ticket response: `id`, `userId`, `subject`, `status`, `createdAt`, `updatedAt`, and recent activity metadata.
- Block, unblock, and force-cancel write payloads require `reason`.
- Add typed admin domain errors for missing users/orders, unsafe force-cancel attempts, and invalid governance actions.

## Implementation Notes

- Metrics use all-time totals plus current active counts; no date filters in v1.
- Force-cancel is the only order intervention in scope; do not add reassignment or arbitrary status mutation.
- Force-cancel must preserve payment and wallet safety. If the current order/payment/wallet state cannot be safely cancelled, return a typed domain error instead of bypassing invariants.
- Support is read-only admin visibility using existing Prisma ticket tables; ticket creation, replies, and lifecycle changes remain out of scope.
- Add Prisma schema changes first, then ask the user to run `pnpm db:migrate:dev --name <migration_name>` manually. Inspect the generated migration SQL after it exists.
- Keep web contracts local to the admin dashboard module unless reused by another app/package.
- API authorization remains mandatory even when the web route also guards admin access.

## Test Plan

- API unit tests:
  - metrics aggregation over representative users, orders, and payments.
  - block/unblock persists user block state and audit records.
  - force-cancel succeeds only for safe order states and records audit reason.
  - force-cancel rejects unsafe states with typed errors.
  - support read model returns ticket summaries without exposing unrelated private data.
- API integration/e2e tests:
  - admin JWT can access admin endpoints.
  - client and booster JWTs are rejected for every admin endpoint.
  - invalid params, queries, and body payloads map to bad request.
  - representative dashboard reads return the expected response shape.
- Web tests:
  - `/admin` redirects non-admin or missing sessions to `/login`.
  - admin shell/navigation renders overview, users, orders, and support views.
  - metrics, users, orders, and support views render parsed API data.
  - empty/API failure states render without fake data.
  - block/unblock and force-cancel server actions submit required reasons and surface API errors.
- Verification commands:
  - targeted API admin tests.
  - relevant web Jest tests.
  - `pnpm biome:fix:all`.
  - API typecheck.
  - `pnpm --filter web build`.

## Assumptions

- Issue `#60` is now full-stack by request.
- Backend work from issues `#52`, `#53`, and `#54` may be absorbed only where needed for this admin dashboard MVP.
- No production fixture data should be shipped.
- Admin governance actions that affect order state or user access must be audited.
- Issue checkboxes should be updated only after the corresponding implementation work is complete.
