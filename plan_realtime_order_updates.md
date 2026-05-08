# Plan: Real-Time Order Updates With SSE

## Summary

The current order visibility behavior is correct: client-created orders start as `awaiting_payment`, and the booster queue only lists paid orders in `pending_booster`. The missing capability is live dashboard refresh after order state changes.

Implement this with an internal order-event pipeline in `apps/api` and Server-Sent Events (SSE) delivery through the authenticated Next.js app. Do not use browser-directed webhooks. Webhooks remain server-to-server only, such as Mercado Pago notifying the API or future outbound integrations.

Chosen v1 transport: **SSE**.

## Current Repo Shape

- API order module follows the existing ports/use-cases/repositories structure under `apps/api/src/modules/orders`.
- `OrdersController` already exposes:
  - `GET /orders`
  - `GET /orders/booster/queue`
  - `GET /orders/booster/work`
  - `POST /orders/:orderId/accept`
  - `POST /orders/:orderId/reject`
  - `POST /orders/:orderId/complete`
- Payment confirmation flows already call `MarkOrderAsPaidUseCase` through the payments-to-orders adapter.
- Web dashboard data is loaded through server actions in:
  - `apps/web/src/modules/client-dashboard/actions/order-actions.ts`
  - `apps/web/src/modules/booster-dashboard/actions/booster-actions.ts`
- Browser code cannot call the API SSE endpoint directly with an `Authorization` header because `EventSource` does not support custom headers and browser JavaScript must not read JWTs.

## Required Decisions

- Keep boosters seeing only `pending_booster` orders.
- Add internal order events in the API application layer.
- Add API SSE endpoint for authenticated event streams.
- Add a Next.js BFF SSE route that reads the httpOnly session cookie server-side and proxies the API event stream to the browser.
- Browser dashboards use SSE events only as invalidation signals, then refresh existing server-rendered data.
- Do not add outbound webhooks in v1.
- Do not add Redis, outbox, or multi-replica delivery in v1.

## Event Contract

Create `apps/api/src/modules/orders/application/ports/order-event-publisher.port.ts`.

```ts
export const ORDER_EVENT_PUBLISHER_KEY = Symbol('ORDER_EVENT_PUBLISHER_KEY');

export type OrderEventType =
	| 'order.paid'
	| 'order.accepted'
	| 'order.rejected'
	| 'order.completed'
	| 'order.cancelled';

export type OrderEvent = {
	id: string;
	type: OrderEventType;
	orderId: string;
	clientId: string | null;
	boosterId: string | null;
	occurredAt: string;
};

export interface OrderEventPublisherPort {
	publish(event: OrderEvent): Promise<void>;
}
```

Rules:

- Generate `id` with `randomUUID()`.
- Use ISO strings for `occurredAt`.
- Keep payload small and non-sensitive.
- Do not include account credentials, payment provider payloads, JWTs, refresh tokens, or customer private data.
- Treat events as dashboard invalidation signals, not as a replacement for REST responses.

## API Implementation

Add an in-memory event bus in orders infrastructure, for example:

- `apps/api/src/modules/orders/infrastructure/events/in-memory-order-event-bus.ts`

The adapter should:

- implement `OrderEventPublisherPort`
- expose a subscribe method for the SSE controller
- keep subscribers in memory
- remove subscribers on disconnect
- publish events synchronously after persistence succeeds
- tolerate subscriber delivery failures without failing the already-persisted business operation

Wire it in `OrdersModule`:

- provide `ORDER_EVENT_PUBLISHER_KEY`
- register the in-memory bus as a provider
- inject the publisher into the order use-cases that mutate status

Emit events from:

- `MarkOrderAsPaidUseCase` after `orderRepository.save(order)` when the status actually changes from `awaiting_payment` to `pending_booster`
- `AcceptOrderUseCase` after save with `order.accepted`
- `RejectOrderUseCase` after rejection save with `order.rejected`
- `CompleteOrderUseCase` after save with `order.completed`
- `CancelOrderUseCase` after save with `order.cancelled`

Important idempotency rule:

- If `MarkOrderAsPaidUseCase` returns because the order is already not `awaiting_payment`, it must not emit `order.paid`.
- Replayed Mercado Pago webhooks must not produce duplicate user-visible order events.

## API SSE Endpoint

Add an authenticated SSE controller under the orders presentation layer. Prefer a separate controller to keep `OrdersController` focused on REST commands and reads.

Suggested endpoint:

```text
GET /orders/events
```

Security:

- use `JwtAuthGuard` and `RolesGuard`
- allow `Role.CLIENT` and `Role.BOOSTER`
- use `CurrentUser`
- never accept user id, role, or subscription target from query params

Delivery filtering:

- clients receive events where `event.clientId === currentUser.id`
- boosters receive:
  - `order.paid` where the order is available to the queue
  - events where `event.boosterId === currentUser.id`
- do not add admin streaming in v1

For `order.paid`, include `boosterId` as the selected booster id when one exists, otherwise `null`. Booster delivery rules:

- if `boosterId` is `null`, send the queue event to all connected boosters
- if `boosterId` is set, send the queue event only to that booster

SSE response format:

```text
event: order.paid
data: {"id":"...","type":"order.paid","orderId":"...","occurredAt":"..."}
```

Operational details:

- set `content-type: text/event-stream`
- set `cache-control: no-cache, no-transform`
- send a heartbeat event every 25 seconds
- clean up the subscriber when the request closes
- do not buffer completed event history in v1
- project events before delivery so `clientId` and `boosterId` stay server-side for filtering only
- replace an existing stream for the same authenticated role/user when a newer one opens

## Web BFF SSE Route

Add a same-origin route handler in `apps/web`, for example:

```text
apps/web/src/app/api/orders/events/route.ts
```

Purpose:

- browser connects to `/api/orders/events` with normal cookies
- route handler reads the sealed httpOnly session with `getAuthSession()`
- route handler opens `GET ${API_URL}/orders/events` from the server with `Authorization: Bearer <accessToken>`
- route handler streams API SSE bytes back to the browser
- route handler passes the browser request abort signal to the upstream API `fetch`

Rules:

- do not expose the access token to browser JavaScript
- if no session exists or the access token is expired, emit a typed `auth.expired` SSE event and close
- if the API returns `401`, close the stream so the client can redirect or stop reconnecting
- pass through `text/event-stream` without parsing on the server unless needed for auth/error handling
- use `cache: 'no-store'`
- do not implement session refresh inside the streaming route in v1; rely on reconnect and existing session behavior

## Web Dashboard Client

Add a small client component/hook under shared or dashboard-specific code. Suggested location:

```text
apps/web/src/shared/dashboard/use-dashboard-events.ts
```

Behavior:

- create one `EventSource('/api/orders/events')` per mounted dashboard
- subscribe to relevant order event names
- on event, call `router.refresh()`
- debounce refreshes, for example one refresh per 500 ms, so multiple events do not trigger refresh storms
- close the `EventSource` on unmount
- stop reconnecting on the explicit `auth.expired` event surfaced by the BFF route
- allow native `EventSource` retry behavior for transient stream errors

Use the hook from small client boundary components, not by converting entire dashboard pages to client components. Suggested wrappers:

- `apps/web/src/modules/client-dashboard/presentation/overview/client-dashboard-live-refresh.tsx`
- `apps/web/src/modules/booster-dashboard/presentation/overview/booster-dashboard-live-refresh.tsx`

Mount these inside the existing server-rendered pages:

- `ClientDashboardPage`
- booster queue/work dashboard views

Dashboard refresh mapping:

- client dashboard refreshes on `order.paid`, `order.accepted`, `order.rejected`, `order.completed`, `order.cancelled`
- booster queue refreshes on `order.paid`, `order.accepted`, `order.rejected`, `order.cancelled`
- booster work refreshes on `order.accepted`, `order.completed`, `order.cancelled`

Use `router.refresh()` rather than introducing client-side fetching libraries for this change. The existing server actions and services should remain the source of dashboard data.

## UI Copy Updates

Preserve the current lifecycle but clarify empty states and labels:

- client `awaiting_payment`: `Aguardando pagamento`
- client `pending_booster`: `Aguardando booster`
- booster queue empty state: `Nenhum pedido pago disponível para aceitar agora.`

Do not show unpaid `awaiting_payment` orders in the booster queue.

## Payment Flow Requirements

Both real and dev payment confirmation paths must produce the same order event behavior:

```text
awaiting_payment
    -> pending_booster
    -> in_progress
    -> completed
```

Required paths:

- Mercado Pago webhook confirms payment through the payments module and calls `MarkOrderAsPaidUseCase`
- dev payment simulation with `approved` calls the same order confirmation path
- duplicate webhook delivery remains idempotent
- failed or cancelled payment paths must not emit `order.paid`

## Reliability Boundaries

V1 is intentionally in-process.

Accepted v1 limitations:

- events are not durable
- connected users can miss events during API restart
- reconnect does not replay missed event history
- multi-API-replica delivery is not supported

Recovery path:

- dashboards still load correct state from REST on initial render and `router.refresh()`
- a missed event is recoverable by reload or any later refresh

Before deploying multiple API replicas, replace or augment the in-memory bus with Redis Pub/Sub or an outbox-backed dispatcher. Use the outbox pattern for future durable side effects such as outbound webhooks, audit notifications, or email.

## Suggested Commit Split

1. `feat(api): add order event publisher`
   - event port, in-memory bus, module wiring, use-case event emission, unit tests
2. `feat(api): stream order events with sse`
   - API SSE controller, role filtering, heartbeat, integration/e2e tests
3. `feat(web): proxy order event stream`
   - Next.js BFF route, session-to-authorization bridge, route tests
4. `feat(web): refresh dashboards from order events`
   - EventSource hook, dashboard live-refresh wrappers, dashboard tests
5. `fix(web): clarify order visibility copy`
   - lifecycle labels and booster empty state copy

## Test Plan

Backend unit tests:

- `MarkOrderAsPaidUseCase` emits `order.paid` only when changing from `awaiting_payment` to `pending_booster`
- `MarkOrderAsPaidUseCase` does not emit when the order is already paid, in progress, completed, cancelled, or missing
- accept/reject/complete/cancel use-cases emit exactly one matching event after successful persistence
- failed use-cases do not emit events

Backend integration/e2e tests:

- `GET /orders/events` requires auth
- client receives only own order events
- client cannot receive another client's events
- booster receives global queue event for unassigned paid order
- selected booster receives queue event for assigned paid order
- unrelated booster does not receive assigned paid order event
- duplicate Mercado Pago webhook does not create duplicate `order.paid` emission

Frontend tests:

- BFF SSE route returns `401` without session
- BFF SSE route forwards authenticated API SSE stream without exposing tokens to the browser
- client dashboard live refresh calls `router.refresh()` on relevant events
- booster dashboard live refresh calls `router.refresh()` on relevant events
- event listener closes on unmount
- refresh calls are debounced
- copy updates render the intended Portuguese text

Verification commands:

```bash
pnpm biome:fix:all
pnpm api exec tsc --noEmit -p tsconfig.json
pnpm web exec tsc --noEmit -p tsconfig.json
pnpm api test -- src/modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case.spec.ts src/modules/orders/application/use-cases/accept-order/accept-order.use-case.spec.ts src/modules/orders/application/use-cases/reject-order/reject-order.use-case.spec.ts src/modules/orders/application/use-cases/complete-order/complete-order.use-case.spec.ts src/modules/orders/application/use-cases/cancel-order/cancel-order.use-case.spec.ts
pnpm api test:e2e -- orders.e2e-spec.ts payments.e2e-spec.ts
pnpm web test -- src/modules/client-dashboard/presentation/overview/client-dashboard-page.spec.tsx src/modules/booster-dashboard/presentation/overview/booster-dashboard-page.spec.tsx
```

## Acceptance Criteria

- A payment-confirmed order appears on an already-open booster dashboard without manual browser refresh.
- When a booster accepts an order, the already-open client dashboard refreshes without manual browser refresh.
- When a booster completes or rejects an order, affected dashboards refresh without manual browser refresh.
- Unpaid `awaiting_payment` orders remain hidden from the booster queue.
- Browser JavaScript never reads or stores JWTs.
- Browser live updates use SSE through the Next.js BFF route, not polling and not browser-directed webhooks.
- Missed SSE events do not corrupt state because REST remains the source of truth.
