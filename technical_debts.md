# Technical Debts

Last reviewed: 2026-05-30

This overview is based on the current roadmap in `AGENTS.md`, the source-of-truth docs in `docs/`, and targeted static inspection of `apps/*` and `packages/*`. It is not a full audit or production readiness sign-off.

## Priority guide

- `High`: can affect correctness, security, payments, data integrity, or production operations.
- `Medium`: likely to slow delivery or create reliability risk as the product grows.
- `Low`: cleanup that improves maintainability but is unlikely to block near-term work.

## High priority

### Realtime delivery is in-process only

**What:** Chat and notification Socket.IO delivery currently depends on a single API process. The contracts explicitly state that there is no Redis Socket.IO adapter yet.

**Why it matters:** In a multi-instance deployment, users connected to a different API instance can miss live chat or notification events. The persisted REST APIs are still the source of truth, but the user experience becomes inconsistent and operational debugging gets harder.

**Evidence:**
- `docs/chat-websocket.md` says delivery is in-process only and missed messages are recovered through REST history.
- `docs/notifications-websocket.md` says delivery is in-process only and REST remains authoritative after reconnect.

**Ideas to resolve:**
- Add a Redis Socket.IO adapter using the existing Redis/BullMQ infrastructure.
- Keep REST as the recovery source, but make live delivery cross-instance.
- Add integration coverage for two gateway instances sharing the same adapter.
- Document scaling assumptions and deployment requirements once the adapter is in place.

### Side effects are not backed by an outbox

**What:** The architecture docs identify Domain Events + Outbox as the pattern for post-payment notifications, unlock scheduling, and audit-related events, but current notification emission is direct and fire-and-forget in use-cases.

**Why it matters:** Direct event emission can be lost if the process crashes after a database write but before the event is delivered. This is especially risky around payment, wallet, notification, and audit workflows where consistency matters.

**Evidence:**
- `docs/tech-architecture.md` lists Domain Events + Outbox as the intended pattern.
- `SendChatMessageUseCase` persists a message and then calls `void this.notificationEvents.emitNotificationUpdated(...)`.
- `UpsertChatNotificationUseCase` persists notification state and then calls `void this.notificationEvents.emitNotificationUpdated(...)`.

**Ideas to resolve:**
- Introduce an `OutboxEvent` table and repository port.
- Write outbox records in the same transaction as the domain state change.
- Add a worker/processor that publishes pending outbox events idempotently.
- Start with chat/notification events, then apply the same pattern to payment and wallet side effects.

### Monetary values use floating-point numbers

**What:** Prices, balances, payment amounts, discounts, and wallet transaction amounts are modeled as `Float` in Prisma.

**Why it matters:** Floating-point arithmetic can produce rounding drift. That is a correctness risk for payment holds, booster earnings, withdrawals, coupons, and admin metrics.

**Evidence:**
- `Order.subtotal`, `Order.totalAmount`, and `Order.discountAmount` are `Float`.
- `Payment.grossAmount` and `Payment.boosterAmount` are `Float`.
- `Wallet.balanceLocked`, `Wallet.balanceWithdrawable`, and `WalletTransaction.amount` are `Float`.
- `Coupon.discount` and pricing values are also `Float`.

**Ideas to resolve:**
- Move persisted money to integer minor units, for example cents, or Prisma `Decimal`.
- Centralize money math in a shared domain utility/value object.
- Add regression tests for coupon rounding, 70% booster split, wallet release, and withdrawal debits.
- Migrate carefully with a generated Prisma migration and explicit data conversion checks.

### Rating and reputation remain schema-only

**What:** Ratings and reputation are required by the product docs and partially represented in the database schema, but there is no visible API module or frontend flow for submitting ratings or applying reputation rules.

**Why it matters:** The schema creates an expectation that reputation exists, but product behavior is not implemented. Leaving this half-modeled can confuse admin dashboards, booster incentives, and future order-completion workflows.

**Evidence:**
- `docs/requirements.md` includes client-to-booster ratings, booster-to-client ratings, and admin-defined reputation/achievement rules.
- `packages/database/prisma/schema.prisma` has `Rating` and `Profile.reputation`.
- `apps/api/src/modules` does not include a `ratings` module.

**Ideas to resolve:**
- Add a ratings module with domain rules for who can rate whom and when.
- Enforce one rating per direction if both client and booster ratings are required; the current `Rating.orderId @unique` shape may only allow one rating per order.
- Recalculate or append reputation changes through a clear policy.
- Add order-completion integration tests and web flows for both roles.

### Chargeback handling is not modeled as a first-class workflow

**What:** Requirements state that chargeback-associated users must be blocked until settlement, but the current schema and modules do not show a dedicated chargeback lifecycle.

**Why it matters:** Chargebacks are payment and fraud-sensitive. If they are handled manually or folded into generic user blocking, auditability and settlement recovery can become ambiguous.

**Evidence:**
- `docs/requirements.md` includes chargeback block and unblock rules.
- The database has user blocking and admin governance actions, but no visible chargeback entity or state machine.

**Ideas to resolve:**
- Add a chargeback domain workflow tied to payment webhook/provider events.
- Record chargeback status, affected payment/order/user, settlement state, and admin overrides.
- Reuse typed domain errors and admin governance audit entries.
- Add e2e or DB-backed integration tests for block-on-chargeback and restore-after-settlement.

## Medium priority

### Package boundaries still point test/build tooling at package `src`

**Status:** Partially addressed in issue `#70` by documenting local TypeScript/Jest source mappings as compatibility shims. A full `@packages/ui` `dist` export conversion is tracked by issue `#73`.

**What:** The architecture says apps should consume shared packages through package dependencies and exports, but several Jest and TypeScript mappings point directly at `packages/*/src/*`. The UI package also exports TypeScript source files instead of built output.

**Why it matters:** Direct source mapping weakens package boundaries. It can hide missing exports, make app builds depend on package internals, and create differences between test-time and runtime behavior.

**Evidence:**
- `docs/tech-architecture.md` says apps must consume shared libraries as packages, not through direct package `src` imports.
- `apps/api/package.json`, API Jest configs, and `apps/web/package.json` map package aliases to `../../packages/*/src`.
- `apps/web/tsconfig.json` maps `@packages/auth/*` and `@packages/shared/*` to package source folders.
- `packages/ui/package.json` exports `./src/*.ts(x)` files directly.

**Ideas to resolve:**
- Ensure every consumed shared entrypoint is declared in the owning package `exports`.
- Move tests toward package exports or a controlled test-only alias strategy.
- Give `@packages/ui` a build output and export `dist` files consistently, or document why UI is intentionally source-consumed by Next.
- Add a boundary check to CI that rejects app imports from package internals.

### Zod major versions are split across packages

**Status:** Addressed in issue `#70` by standardizing workspace manifests on Zod v4.

**What:** The workspace has both Zod v3 and Zod v4 dependencies.

**Why it matters:** Shared schemas move between API, web, and packages. Mixed major versions can create incompatible schema/error types, duplicated dependency weight, and confusing validation behavior.

**Evidence:**
- `packages/shared`, `apps/api`, and `apps/web` use Zod v3 ranges.
- `packages/config` uses Zod v4.

**Ideas to resolve:**
- Pick one workspace-wide Zod major version.
- Upgrade or downgrade package schemas together.
- Run focused validation tests for API pipes, shared schemas, and config parsing after alignment.

### Roadmap and implementation status have drifted

**Status:** Addressed in issue `#70` by reconciling implemented roadmap items in `AGENTS.md`.

**What:** Some roadmap checkboxes in `AGENTS.md` appear stale compared with the codebase. For example, RBAC, pricing extras, chat, tickets, and API validation coverage now have substantial implementation, while the roadmap still lists related items as incomplete.

**Why it matters:** Stale roadmap status makes planning unreliable and can cause duplicate work or missed review of the actual remaining gaps.

**Evidence:**
- `apps/api/src/modules/auth/presentation` includes `Roles`, `RolesGuard`, and `JwtAuthGuard`.
- Shared order extras include all priced and zero-cost extras from the requirements.
- Chat, notifications, and tickets modules exist with controllers/gateways and schemas.
- `AGENTS.md` still lists multiple related roadmap items as unchecked.

**Ideas to resolve:**
- Reconcile the roadmap against current code and tests.
- Split broad unchecked items into precise remaining work, such as production socket scaling, rating workflows, or missing e2e coverage.
- Mark completed items with `[x]` only after targeted verification.

### Database migration history needs cleanup review

**Status:** Addressed in issue `#70` by adding `docs/migration-history.md` without editing generated migration SQL.

**What:** Migration directory names do not always match their contents. One migration named `add_support_ticket_lifecycle` contains pricing-version index work, and another later migration with the same name contains the ticket lifecycle changes.

**Why it matters:** Migration names are operational documentation. Misleading names slow incident response and make schema-history review harder, especially when diagnosing production migration failures.

**Evidence:**
- `packages/database/prisma/migrations/20260528020611_add_support_ticket_lifecycle/migration.sql` drops and recreates `pricing_versions_single_active_key`.
- `packages/database/prisma/migrations/20260528140000_add_support_ticket_lifecycle/migration.sql` adds `TicketStatus` and ticket lifecycle columns/indexes.

**Ideas to resolve:**
- Do not edit already-applied migrations.
- If these migrations are already shared/applied, document the naming mistake in a migration history note.
- If not yet applied anywhere, regenerate with accurate names after confirming with the team.
- Add migration review to PR checks for schema changes.

### Frontend environment config is only lightly validated

**Status:** Addressed in issue `#70` by adding Zod-backed web env validation for server and public web settings.

**What:** The web app reads environment variables through local helpers, but it does not appear to use the shared config package or a Zod-validated web env contract.

**Why it matters:** Misconfigured URLs, session secrets, or cookie domains can break BFF calls, Socket.IO cookie handshakes, and production auth behavior in ways that are only caught at runtime.

**Evidence:**
- `apps/web/src/shared/env/web-env.ts` and `public-env.ts` read `process.env` directly.
- The websocket docs require coordinated `NEXT_PUBLIC_API_URL`, `CHAT_SOCKET_ALLOWED_ORIGINS`, `WEB_SESSION_SECRET`, and `WEB_SESSION_COOKIE_DOMAIN` for production subdomains.

**Ideas to resolve:**
- Add a web env schema in `@packages/config` or a web-local env module.
- Validate required production variables at app startup.
- Keep browser-safe public variables separate from server-only secrets.
- Add tests for production cookie-domain and API URL validation.

## Low priority

### API docs/OpenAPI coverage should be rechecked

**Status:** Rechecked in issue `#70`. Swagger packages and bootstrap are not currently installed, so implementation is tracked by issue `#72` before public API integration work depends on generated docs.

**What:** The architecture names OpenAPI/Swagger as the API documentation strategy. Controllers and schemas have grown substantially, so generated docs may not fully reflect current contracts.

**Why it matters:** Incomplete API docs slow frontend/backend coordination and make external integration testing harder.

**Evidence:**
- `docs/stack.md` lists OpenAPI via Swagger.
- API controllers now cover orders, payments, wallet, chat, notifications, tickets, and admin governance.

**Ideas to resolve:**
- Generate or inspect Swagger output after the current controller set.
- Add schema examples for payment, wallet, chat, ticket, and admin endpoints.
- Add a lightweight CI check that the Swagger document can be generated.

### Support and chat privacy retention policies need operational detail

**Status:** Addressed in issue `#70` by adding `docs/privacy-retention.md`.

**What:** Requirements call out secure storage and privacy obligations for chat and ticket history, but retention/erasure rules are not yet detailed in the technical docs.

**Why it matters:** Chat and tickets can contain sensitive user data. Without explicit retention and access policies, implementation choices can drift as support features expand.

**Evidence:**
- `docs/requirements.md` requires persisted chat/ticket history and privacy-aligned data handling.
- The database persists `ChatMessage`, `Ticket`, and `TicketMessage`.

**Ideas to resolve:**
- Document retention periods, admin access rules, and erasure/anonymization behavior.
- Add audit entries for sensitive admin access if needed.
- Review whether ticket/chat exports or deletion requests are in scope for LGPD operations.

## Suggested sequencing

1. Fix production correctness risks first: money representation, outbox, realtime scaling, chargeback workflow.
2. Reconcile roadmap/documentation so new work starts from an accurate plan.
3. Tighten package boundaries and dependency versions before the monorepo grows further.
4. Fill product gaps: ratings/reputation, API docs, and privacy retention detail.
