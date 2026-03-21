# CONTINUITY

## [PLANS]
- 2026-03-21T08:08:03-04:00 [USER] Keep `AGENTS.md` concise, preserve key repo rules, reduce overlap, and reorder issue execution so issue review and planning happen before branch creation.
- 2026-03-21T08:46:08-04:00 [USER] Implement issue `#22` for real Mercado Pago initiation and verified webhook reconciliation after the planning pass.

## [DECISIONS]
- 2026-03-21T08:08:03-04:00 [CODE] `AGENTS.md` now uses a consolidated structure with a global operating baseline first and repo-specific rules second.
- 2026-03-21T08:08:03-04:00 [CODE] Issue workflow order is now: inspect issue, check overlap, prepare plan, then create branch/worktree/PR, then implement and verify.
- 2026-03-21T08:08:03-04:00 [CODE] Workspace change history should live in `.agent/CHANGELOG.md` instead of inline in `AGENTS.md`.
- 2026-03-21T08:08:03-04:00 [CODE] `AGENTS.md` now explicitly distinguishes `.agent/CONTINUITY.md` as current-state handoff context and `.agent/CHANGELOG.md` as durable project history.
- 2026-03-21T08:46:08-04:00 [CODE] Issue `#22` implementation uses Checkout Pro preference creation, a provider-specific Mercado Pago webhook route, and approved-first reconciliation while still persisting non-approved provider statuses.
- 2026-03-21T08:46:08-04:00 [CODE] `packages/integrations` is now being formalized as `@packages/integrations` with the official Mercado Pago SDK instead of continuing the old alias-only pattern.

## [PROGRESS]
- 2026-03-21T08:08:03-04:00 [TOOL] Rewrote `AGENTS.md` to merge the requested baseline with existing repo-specific rules and added this continuity file scaffold.
- 2026-03-21T08:08:03-04:00 [TOOL] Moved the existing inline `AGENTS.md` changelog into `.agent/CHANGELOG.md` and updated maintenance guidance to point there.
- 2026-03-21T08:08:03-04:00 [TOOL] Added an explicit `CONTINUITY.md` versus `CHANGELOG.md` boundary section to `AGENTS.md`.
- 2026-03-21T08:23:58-04:00 [TOOL] Verified merged PR `#42` (`40-prepare-payments-provider-contract`) against GitHub issue `#40`, the merged diff on `main`, Prisma schema constraints, and targeted payments tests.
- 2026-03-21T08:46:08-04:00 [TOOL] Created and pushed branch `22-mercadopago-wrapper-webhooks`; draft PR creation was attempted first but GitHub rejected it until the branch has at least one commit ahead of `main`.
- 2026-03-21T08:46:08-04:00 [TOOL] Implemented the non-DB portion of issue `#22`, ran `pnpm biome:fix:all`, ran `pnpm --filter api exec tsc --noEmit -p tsconfig.json`, reran targeted unit/integration tests, and reran `pnpm --filter api test:e2e -- payments.e2e-spec.ts`.
- 2026-03-21T12:50Z [TOOL] Reproduced the DB-backed payments failure, regenerated Prisma with `pnpm -w db:generate`, and reran `pnpm --filter api test:integration:db -- payments.db.integration.spec.ts` to green.
- 2026-03-21T09:16:13-04:00 [TOOL] Installed the external `nestjs-doctor` skill from `RoloBits/nestjs-doctor` path `packages/nestjs-doctor/skill` into `~/.codex/skills/nestjs-doctor`.
- 2026-03-21T13:03Z [TOOL] Hardened the Mercado Pago webhook path against replay-by-body-id and unsupported topics, then reran webhook-focused unit/integration/e2e coverage plus `pnpm biome:fix:all`, API typecheck, and the DB-backed payments lane.
- 2026-03-21T13:07Z [TOOL] Closed the remaining alias-replay gap by removing topic from the processed webhook key, added alias-replay regressions, and reran the webhook-focused, e2e, formatting, typecheck, and DB-backed payments verification lanes.

## [DISCOVERIES]
- 2026-03-21T08:08:03-04:00 [TOOL] `.agent/CONTINUITY.md` did not exist before this change.
- 2026-03-21T08:23:58-04:00 [TOOL] Issue `#40` is a narrowed prerequisite for `FR-025`, not the full Mercado Pago integration; its scope is local payment identity ownership, gateway field persistence, and duplicate-protection groundwork before issue `#22`.
- 2026-03-21T08:23:58-04:00 [TOOL] Prisma already enforces persistent uniqueness for `Payment.gatewayId` and the diff relies on app-level duplicate checks plus the existing schema-level constraint on `Payment.orderId`.
- 2026-03-21T08:46:08-04:00 [TOOL] DB-backed payments tests currently fail with `Unknown argument gatewayReferenceId` because the Prisma client/database still reflect the old `Payment` shape; the code/schema changes now require a human-run Prisma migration and regenerated client before DB verification can pass.
- 2026-03-21T12:50Z [TOOL] Applying the migration was not sufficient for DB verification; Prisma Client also had to be regenerated locally before the repository/test code recognized `gatewayReferenceId` and `gatewayStatusDetail`.
- 2026-03-21T13:03Z [CODE] Using Mercado Pago body `id` as the dedupe key was unsafe because the signature manifest does not cover that field; replay protection is now keyed from provider-bound `topic + notificationResourceId` instead.
- 2026-03-21T13:07Z [CODE] Including topic in the processed webhook key was still redundant and unsafe because Mercado Pago signature verification does not bind topic; the canonical replay key is now only the provider notification resource id.

## [OUTCOMES]
- 2026-03-21T08:08:03-04:00 [CODE] Workspace guidance now has an explicit continuity mechanism and a less overlapping issue-start workflow.
- 2026-03-21T08:08:03-04:00 [CODE] `AGENTS.md` is shorter and operational, while historical change notes now live in `.agent/CHANGELOG.md`.
- 2026-03-21T08:23:58-04:00 [TOOL] Verification result: PR `#42` does satisfy issue `#40` as written; it should not be interpreted as completing the full `FR-025` product requirement or issue `#22`.
- 2026-03-21T08:46:08-04:00 [CODE] Issue `#22` non-DB implementation is in place: payment creation now returns a Mercado Pago checkout URL, webhooks reconcile through provider data instead of trusting internal IDs from transport input, and the new gateway reference/status detail fields are wired through the payment aggregate and repository contracts.
- 2026-03-21T12:50Z [TOOL] Issue `#22` now has green targeted verification across unit, integration, e2e, and DB-backed payments lanes after Prisma Client regeneration.
- 2026-03-21T09:16:13-04:00 [TOOL] `nestjs-doctor` is now available as a local Codex skill for future turns after client restart.
- 2026-03-21T13:03Z [CODE] The webhook route now rejects unsupported Mercado Pago topics before provider fetch and ignores replayed deliveries even when the unsigned body event id changes.
- 2026-03-21T13:07Z [CODE] The webhook route now also ignores alias-based replays where the same Mercado Pago notification is delivered once as `payment` and once as `payment.updated`.
