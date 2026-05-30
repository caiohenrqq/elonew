# Migration History Notes

This file records migration-history notes that should not be fixed by editing
already-applied Prisma migration SQL.

## 2026-05 pricing-version index migrations

The following migrations overlap in purpose and naming:

- `20260521003628_enforce_unique_pricing_version_status`
- `20260522023625_apply_idx_pricing_versions`
- `20260528020611_add_support_ticket_lifecycle`

The first two names describe pricing-version index work. The third name is
misleading: its SQL also drops and recreates `pricing_versions_single_active_key`
instead of adding support ticket lifecycle changes.

## 2026-05 support ticket lifecycle migration

`20260528140000_add_support_ticket_lifecycle` is the migration that actually
adds `TicketStatus`, `tickets.orderId`, ticket status migration SQL, ticket
indexes, and the order foreign key.

## Operational rule

Do not rename or edit these migration directories if they may have been applied
outside a disposable local database. Use new corrective migrations for schema
changes and keep this note as the audit trail for the misleading name.
