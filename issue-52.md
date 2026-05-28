# Issue #52 Implementation Plan

Source: https://github.com/caiohenrqq/elonew/issues/52

Title: `[FR-058/FR-059/FR-060] Implement support tickets domain, persistence, and API lifecycle`

## Goal

Implement the backend support ticket system required by FR-058, FR-059, and FR-060. The MVP scope is authenticated API behavior, persisted ticket history, and privacy-aware access control.

Frontend dashboard implementation remains out of scope for this issue.

## Quality Overview

The original draft correctly identified the backend-only scope and the existing `Ticket` and `TicketMessage` database models, but it left key implementation decisions open. This enhanced plan locks the status model, order-linking behavior, reopen policy, admin route shape, schema impact, access rules, and test coverage so the issue can be implemented without additional product decisions.

## Current State

- `Ticket` and `TicketMessage` already exist in `packages/database/prisma/schema.prisma`.
- There is no `apps/api/src/modules/tickets` module yet.
- Admin dashboard can list ticket summaries through `GET /admin/support/tickets`, but this is read-only dashboard plumbing, not a ticket lifecycle API.
- The client order details UI has an `Abrir Ticket` button, but frontend wiring is deferred.
- Requirements require a ticketing system, persisted history, and privacy-aware handling.

## Locked Product Decisions

- Ticket statuses are `OPEN`, `WAITING_USER`, `WAITING_SUPPORT`, and `CLOSED`.
- A user-created ticket starts as `WAITING_SUPPORT`.
- A requester reply sets the ticket to `WAITING_SUPPORT`.
- An admin reply sets the ticket to `WAITING_USER`.
- A reply to a `CLOSED` ticket reopens it automatically using the same reply-status rule.
- Admins can also reopen closed tickets through status update.
- Tickets can optionally link to an order through `orderId`.
- Only clients can create order-linked tickets, and the linked order must belong to the current client.
- Boosters can create general support tickets, but cannot create order-linked tickets in this issue.
- Admin ticket lifecycle routes should use `/admin/tickets`.
- Keep existing `GET /admin/support/tickets` as the dashboard summary endpoint.

## Proposed Backend Scope

### Domain

- Add a `tickets` module using the existing module structure:
  - `presentation`
  - `application/use-cases`
  - `application/ports`
  - `domain`
  - `infrastructure`
- Define a typed ticket status model with:
  - `OPEN`
  - `WAITING_USER`
  - `WAITING_SUPPORT`
  - `CLOSED`
- Define domain errors for:
  - ticket not found
  - ticket access denied
  - invalid ticket status transition
  - invalid ticket message operation
  - invalid order-linked ticket ownership
  - unsupported role for order-linked ticket creation

### Persistence

- Update Prisma schema before implementation:
  - add a `TicketStatus` enum
  - change `Ticket.status` from `String` to `TicketStatus`
  - add optional `Ticket.orderId`
  - add `Ticket.order` relation to `Order`
  - add `Order.tickets`
  - add indexes for user-owned listing, order-linked lookup, and admin operational listing
- Suggested migration name:

```bash
pnpm db:migrate:dev --name add_support_ticket_lifecycle
```

- Do not hand-write the migration by default. After Prisma generates it, inspect `migration.sql`.

### Application and Repository

- Add a ticket repository port with methods for:
  - create ticket with initial message
  - find ticket detail with messages
  - list tickets for a user
  - list tickets for admin
  - add message and update ticket status atomically
  - update ticket status
  - verify client-owned order linkage
- Implement a Prisma repository adapter.
- Use transactions where message creation and status updates must be persisted together.
- Return ticket messages in chronological order.

### API

User routes:

- `POST /tickets`
  - roles: `CLIENT`, `BOOSTER`
  - body: `subject`, `content`, optional `orderId`
  - `orderId` accepted only for `CLIENT` users and only when the order belongs to the current client
- `GET /tickets`
  - roles: `CLIENT`, `BOOSTER`
  - lists only the current user's tickets
- `GET /tickets/:ticketId`
  - roles: `CLIENT`, `BOOSTER`
  - returns only the current user's ticket detail and message history
- `POST /tickets/:ticketId/messages`
  - roles: `CLIENT`, `BOOSTER`
  - allows replies only to the current user's ticket

Admin routes:

- `GET /admin/tickets`
  - roles: `ADMIN`
  - lists all tickets with filters for status, user query, and limit where practical
- `GET /admin/tickets/:ticketId`
  - roles: `ADMIN`
  - returns any ticket detail and message history
- `POST /admin/tickets/:ticketId/messages`
  - roles: `ADMIN`
  - replies to any ticket and sets status to `WAITING_USER`
- `PATCH /admin/tickets/:ticketId/status`
  - roles: `ADMIN`
  - updates status to `OPEN`, `WAITING_USER`, `WAITING_SUPPORT`, or `CLOSED`

Keep request validation at the boundary with Zod plus `ZodValidationPipe`.

### Response Shape

Return privacy-minimal responses:

- ticket id
- user id
- optional order id
- subject
- status
- created at
- updated at
- messages with id, sender id, sender role, content, and created at

Do not expose user email, username, order credentials, or unrelated order details from ticket endpoints.

## Security Rules

- Users can list, read, and reply only to tickets where `ticket.userId === currentUser.id`.
- Admins can list, read, reply, and update status for any ticket.
- Cross-user ticket access should use not-found style behavior when that better avoids exposing ticket existence.
- Ticket messages must never expose unrelated user data.
- Optional `orderId` must be validated against client ownership at creation time.
- Boosters cannot attach `orderId` in this issue.
- Closed tickets can be reopened by an involved user or admin reply.

## Acceptance Criteria

- [ ] Authenticated clients and boosters can create general support tickets.
- [ ] Authenticated clients can create tickets linked to their own orders.
- [ ] Boosters cannot create order-linked tickets.
- [ ] Authenticated users can list and read only their own tickets.
- [ ] Admins can list and read all tickets through `/admin/tickets`.
- [ ] Existing `GET /admin/support/tickets` summary behavior remains compatible.
- [ ] Ticket message history is persisted and returned in chronological order.
- [ ] User replies set status to `WAITING_SUPPORT`.
- [ ] Admin replies set status to `WAITING_USER`.
- [ ] Closed tickets reopen automatically on a valid reply.
- [ ] Admins can update ticket status directly.
- [ ] Forbidden or cross-user access uses the project-standard domain error mapping.
- [ ] Runtime request validation rejects malformed bodies, params, and queries.
- [ ] The implementation does not include frontend dashboard work.

## Test Plan

### Unit

- Ticket domain status transition rules.
- Create-ticket use case persists initial message and starts as `WAITING_SUPPORT`.
- User reply sets status to `WAITING_SUPPORT`.
- Admin reply sets status to `WAITING_USER`.
- Reply to closed ticket reopens it.
- Client-owned `orderId` is accepted.
- Non-owned `orderId` is rejected.
- Booster-provided `orderId` is rejected.
- Access policy rejects non-owner user access.
- Admin access bypasses owner-only restriction.

### Integration / E2E

- `POST /tickets` creates a general ticket and initial message.
- `POST /tickets` creates an order-linked ticket for a client-owned order.
- `POST /tickets` rejects a booster-provided `orderId`.
- `GET /tickets` returns only current user tickets.
- `GET /tickets/:ticketId` rejects another user's ticket.
- `POST /tickets/:ticketId/messages` persists replies in chronological order.
- `POST /admin/tickets/:ticketId/messages` persists admin replies and updates status.
- `PATCH /admin/tickets/:ticketId/status` is admin-only.
- `GET /admin/tickets` lists all tickets for admins.
- `GET /admin/support/tickets` remains compatible for dashboard summary consumers.
- Invalid payloads return `400 Bad Request`.

Recommended targeted checks:

```bash
pnpm api test -- src/modules/tickets
pnpm api test:e2e -- tickets.e2e-spec.ts
pnpm api test:integration:db -- tickets.db.integration.spec.ts
pnpm api exec tsc --noEmit -p tsconfig.json
pnpm biome:fix:all
```

## Documentation

- Update `docs/requirements.md` roadmap checkbox for support tickets only after the backend API lifecycle is complete.
- Add or update backend API notes only if there is already a suitable documentation location; otherwise keep endpoint behavior covered by tests.
- Document deferred scope:
  - frontend ticket creation UI
  - attachments
  - SLA queues
  - support assignment
  - live ticket notifications
  - booster order-linked support tickets

## Suggested Implementation Order

1. Check for dirty Prisma migrations before editing `schema.prisma`.
2. Update Prisma schema for `TicketStatus` and optional `orderId`.
3. Ask the human to run `pnpm db:migrate:dev --name add_support_ticket_lifecycle`.
4. Inspect the generated migration SQL.
5. Add ticket domain model, status constants, and domain errors.
6. Add repository port and in-memory test repository.
7. Write use-case tests for create, list, get, reply, admin reply, and status update.
8. Implement Prisma ticket repository.
9. Add controller schemas and routes.
10. Wire `TicketsModule` into `AppModule`.
11. Add API domain error mappings.
12. Add e2e and DB-backed integration coverage for auth, ownership, admin access, order linkage, status behavior, and invalid payloads.
13. Run targeted quality gates.
14. Update docs only if the backend lifecycle is complete.
