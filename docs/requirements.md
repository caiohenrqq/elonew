# Product Requirements

## Product overview
Web platform for operating League of Legends boosting services with a marketplace flow between clients, boosters, and admins. The platform covers account management, ordering, payment lifecycle, communication, support, ratings, and administrative control.

## Functional requirements

### 1. Roles and access
- FR-001: Three roles: `Cliente`, `Booster`, `Admin`.
- FR-002: Booster access is invite-only.
- FR-003: Admins can create booster accounts.
- FR-004: Users should not maintain multiple accounts.
- FR-005: Registration requires `username`, `email`, `password`.
- FR-006: New accounts are activated only after email confirmation.
- FR-007: Login is email-based.

### 2. Service catalog
- FR-008: Initial game scope: `League of Legends`.
- FR-009: Initial services: `Elo Boost`/`Elojob`, `Duo Boost`, `Md5`, `Coaching`.
- FR-010: Admins configure pricing by elo.
- FR-011: Clients can request services from the catalog.

### 3. Service request data and validation
- FR-012: Service creation requires authenticated user session.
- FR-013: Required order fields: `Serviço`, `Liga atual`, `Divisão atual`, `PDL inicial`, `Liga desejada`, `Divisão desejada`, `Servidor`, `Fila desejada`, `PDLs ganhos por vitória`, `Prazo de entrega`.
- FR-014: Required account access fields for execution: `Login`, `Invocador`, `Senha`, `Confirmar Senha`.
- FR-015: `Senha` and `Confirmar Senha` must match.
- FR-016: Subtotal is calculated and shown before payment.
- FR-017: Coupon codes can be applied at checkout.
- FR-018: Selected extras are locked after order finalization.

### 4. Order lifecycle
- FR-019: Lifecycle includes: account creation, order placement, `Aguardando Pagamento`, `Pendente/Esperando Booster Pegar`, `Pagamento Confirmado`.
- FR-020: Client can select a booster.
- FR-021: Booster can accept or reject an order.
- FR-022: Client cancellation is allowed only before booster acceptance.
- FR-023: No cancellation penalty before acceptance.
- FR-024: Progress proof/image upload is currently excluded.

### 5. Payments, balances, and withdrawals
- FR-025: Payment gateway: `Mercado Pago`.
- FR-026: Payment methods: `Cartão de Crédito`, `PIX`, `Boleto`.
- FR-027: Client payment remains held until service finalization.
- FR-028: Booster earnings are fixed at 70% of sale value.
- FR-029: No minimum withdrawal amount.
- FR-030: Withdrawal unlock is delayed by a configurable lock period after completion.
- FR-031: Withdrawal eligibility is released automatically after lock expiration.
- FR-032: `Account Credentials` are stored only after payment confirmation.
- FR-033: `Account Credentials` are deleted when payment is not confirmed.
- FR-034: `Account Credentials` are permanently deleted after service finalization.

### 6. Service extras
Priced extras:
- FR-035: `Taxa MMR Nerfado` (+25%)
- FR-036: `Taxa MMR Buffado` (+35%)
- FR-037: `Serviço Prioritário` (+10%)
- FR-038: `Booster Favorito` (+10%)
- FR-039: `Super Restrição` (+35%)
- FR-040: `Vitória extra` (+20%)
- FR-041: `Horários Restritos` (+10%)
- FR-042: `Redução do KD` (+30%)
- FR-043: `Redução no Prazo de Entrega` (+20%)
- FR-044: `Serviço Solo` (+30%)

Zero-cost extras:
- FR-045: `Chat Offline`
- FR-046: `Posição de Feitiços`
- FR-047: `Rotas Específicas`
- FR-048: `Campeões Específicos`
- FR-049: `Stream Online`
- FR-050: Pricing modifiers are applied deterministically.

### 7. Coupons
- FR-051: Admin can create coupons.
- FR-052: Admin can disable coupons.
- FR-053: Coupons can be restricted to first-account usage.

### 8. Communication and notifications
- FR-054: Internal chat between client and booster.
- FR-055: Chat history is persisted.
- FR-056: Notifications are in-platform only.
- FR-057: Discord integration is currently out of scope.

### 9. Support tickets
- FR-058: Ticketing system for user issues.
- FR-059: Ticket history is persisted.
- FR-060: Ticket data handling must respect security and privacy requirements.

### 10. Ratings and reputation
- FR-061: Clients can rate boosters.
- FR-062: Boosters can rate clients.
- FR-063: Admin-defined reputation/achievement rules are supported.

### 11. Admin control
- FR-064: Admin financial dashboard.
- FR-065: Admin metrics: revenue, orders, active users.
- FR-066: Admin can intervene in any order state.
- FR-067: Admin can block any user account.

### 12. Chargebacks
- FR-068: Chargeback-associated users are blocked.
- FR-069: Access is restored only after settlement.

## Non-functional requirements

### Availability and platform
- NFR-001: Web application only.
- NFR-002: Target continuous operation (24/7).

### Operations and cost
- NFR-003: Payment hold and withdrawal release logic is automated.
- NFR-004: Initial infrastructure and operations favor low complexity and low cost.

### Privacy and data protection
- NFR-005: Secure storage for chat and ticket history.
- NFR-006: Data handling aligned with applicable privacy-law obligations (including LGPD context).

## Inputs
- Registration data (`username`, `email`, `password`, email verification token).
- Booster invitation/account creation payload by admin.
- Authenticated session token.
- Service request payload (service type, rank fields, server, queue, LP gain, deadline, selected booster).
- Account access payload (`login`, `invocador`, `senha`, `confirmar senha`).
- Extras and coupon payload.
- Mercado Pago payment events.
- Order transition events.
- Chat and ticket messages.
- Rating submissions.
- Reputation rule configuration by admin.
- Coupon configuration (`code`, enabled state, first-account restriction).
- Chargeback events.
- Withdrawal requests.

## Outputs
- Role-based accounts and activation status.
- Verified email/account state.
- Orders with lifecycle state history.
- Pricing composition with extras and coupons.
- Payment hold/confirmation states linked to orders.
- Credential storage/deletion state according to payment and completion rules.
- Booster wallet states (locked vs withdrawable).
- Withdrawal eligibility after lock period.
- Coupon validation result at checkout.
- Persistent chat/ticket history records.
- Rating/reputation records.
- Admin dashboard metrics.
- Chargeback block/unblock status.

## Business rules to enforce
- Booster receives exactly 70% of each sale.
- Cancellation is allowed only before booster acceptance and has no penalty.
- Chargeback blocks account until settlement.
- Withdrawal unlock only after lock period expiration.
- Credential retention/deletion follows payment/completion lifecycle.
- Extras become immutable after order finalization.

## Current constraints
- Game scope: League of Legends only.
- Service scope: Elojob, Duo Boost, Md5, Coaching only.
- Platform scope: web only.
- Payment gateway: Mercado Pago only.
- Discord integration excluded.
- Proof/image upload excluded.
- Booster onboarding remains invite-only.
