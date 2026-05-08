# SSE Order Updates: Vercel React & Security Best Practices Report

## Executive Summary

Reviewed and remediated the SSE order-update implementation against `$vercel-react-best-practices` and `$security-best-practices` for TypeScript, React, Next.js, and the NestJS API code touched by this feature.

No critical or high-severity issues were found. The implementation now keeps browser JavaScript away from JWTs, proxies the stream through the Next.js BFF, authenticates and role-filters API events, minimizes browser-delivered event payloads, propagates browser disconnects upstream, and avoids unbounded same-user stream growth.

## Fixed Findings

### M-001: SSE subscriptions were unbounded per user/session

- Severity: Medium
- Status: Fixed
- Files:
  - `apps/api/src/modules/orders/infrastructure/events/in-memory-order-event-bus.ts`
  - `apps/api/src/modules/orders/presentation/orders-events.controller.ts`
  - `apps/api/src/modules/orders/presentation/orders-events.controller.spec.ts`
- Resolution: The in-memory event bus now supports keyed subscriptions. The SSE controller uses a stable key per role and user, so a newer stream replaces the previous stream for the same authenticated user. The replaced stream is completed and removed from the subscriber set.
- Verification: Added controller coverage proving a second stream for the same user completes the first stream and receives future events.

### M-002: Browser disconnect was not propagated to the upstream API stream

- Severity: Medium
- Status: Fixed
- Files:
  - `apps/web/src/app/api/orders/events/route.ts`
  - `apps/web/src/app/api/orders/events/route.spec.ts`
- Resolution: The BFF route now accepts the incoming `Request` and passes `request.signal` into the upstream API `fetch`, allowing browser disconnects to cancel the proxied stream.
- Verification: Added route coverage asserting the upstream fetch receives the same abort signal from the incoming request.

### M-003: Booster SSE payloads exposed client identifiers

- Severity: Medium
- Status: Fixed
- Files:
  - `apps/api/src/modules/orders/presentation/orders-events.controller.ts`
  - `apps/api/src/modules/orders/presentation/orders-events.controller.spec.ts`
- Resolution: The controller now projects domain events before SSE delivery and only sends `{ id, type, orderId, occurredAt }` to the browser. `clientId` and `boosterId` remain server-side for filtering.
- Verification: Added controller coverage proving streamed payloads do not expose `clientId`.

### L-001: Client EventSource closed on every error and did not retry transient failures

- Severity: Low
- Status: Fixed
- Files:
  - `apps/web/src/shared/dashboard/use-dashboard-events.ts`
  - `apps/web/src/shared/dashboard/use-dashboard-events.spec.tsx`
  - `apps/web/src/app/api/orders/events/route.ts`
- Resolution: The dashboard hook now lets `EventSource` use its built-in retry behavior for ordinary stream errors. The BFF route emits a typed `auth.expired` SSE event for missing or expired sessions, and the hook closes only on that terminal auth event.
- Verification: Added hook coverage proving transient `error` events do not close the stream, while `auth.expired` does.

## Positive Observations

- Browser JavaScript connects to `/api/orders/events` and does not read or store JWTs.
- The BFF route uses the httpOnly session server-side and forwards the access token only from server to API.
- The API SSE endpoint uses `JwtAuthGuard`, `RolesGuard`, and explicit role metadata.
- Dashboard refresh uses `router.refresh()` and existing server data paths, so event payloads are only invalidation signals and not trusted application state.
- Dashboard data fetching remains parallelized where it matters, for example booster queue/work pages use `Promise.all`.
- The dashboard hook creates one `EventSource` per dashboard mount and removes event listeners on unmount.

## Verification

- `pnpm biome:fix:all`
- `pnpm api test -- src/modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case.spec.ts src/modules/orders/application/use-cases/accept-order/accept-order.use-case.spec.ts src/modules/orders/application/use-cases/reject-order/reject-order.use-case.spec.ts src/modules/orders/application/use-cases/cancel-order/cancel-order.use-case.spec.ts src/modules/orders/application/use-cases/complete-order/complete-order.use-case.spec.ts src/modules/orders/presentation/orders-events.controller.spec.ts`
- `pnpm web test -- src/app/api/orders/events/route.spec.ts src/shared/dashboard/use-dashboard-events.spec.tsx src/modules/client-dashboard/presentation/overview/client-dashboard-page.spec.tsx src/modules/booster-dashboard/presentation/overview/booster-dashboard-page.spec.tsx`
- `pnpm api exec tsc --noEmit -p tsconfig.json`
- `pnpm web exec tsc --noEmit -p tsconfig.json`
- `pnpm api test:e2e -- orders.e2e-spec.ts`
- `pnpm --filter web test:e2e -- dashboard.spec.ts`
