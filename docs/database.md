# Database

## Overview
The platform runs on PostgreSQL with a single primary instance. This is enough for current scale assumptions and keeps operations simple while we stabilize product flows around orders, payments, balances, and support history.

## Data design priorities
- Correctness of financial and order state transitions.
- Predictable query performance on operational screens (admin, wallet, order queues).
- Clear retention/deletion behavior for sensitive credentials and user data.

## Transaction boundaries
Critical flows should execute in explicit database transactions:
- Order state transitions tied to payment events.
- Payment confirmation, hold/release updates, and wallet ledger updates.
- Any operation that moves funds between locked and withdrawable states.

If a flow changes financial state and business state together, it should be one transaction.

## Baseline indexes
Start with these indexes and review them with real production query plans:
- `users(email)` unique
- `orders(status)`
- `orders(client_id)`
- `orders(booster_id)`
- `payments(order_id)`
- `wallet_transactions(booster_id, created_at)`

## Operational guidance
- Keep migrations small and reversible.
- Treat schema changes in payment/wallet tables as high-risk and release behind rollout checks.
- Monitor slow queries early; optimize based on observed workload, not assumptions.
