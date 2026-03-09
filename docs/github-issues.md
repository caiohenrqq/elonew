# GitHub Issues Template (Orders/Payments)

Use this template for all backlog items.

```md
## Task
<clear implementation objective>

## Why
<requirement/business reason>

## Steps
- [ ] <step 1>
- [ ] <step 2>
- [ ] <step 3>

## Done When
- [ ] <verifiable outcome 1>
- [ ] <verifiable outcome 2>
- [ ] <verifiable outcome 3>
```

---

## Ready-to-Create Issues

### 1) FR-012 + FR-013: Enforce authenticated order creation with required payload

## Task
Implement authenticated order creation with full FR-013 required fields validation.

## Why
Requirements mandate authenticated service creation and mandatory order input fields, but current flow only accepts `orderId`.

## Steps
- [ ] Add auth guard/policy to `POST /orders`
- [ ] Extend create-order DTO/use-case to include FR-013 fields
- [ ] Add request validation schema and map validation errors to `400`
- [ ] Persist required fields into `Order`
- [ ] Add unit + integration + db-integration tests

## Done When
- [ ] Unauthenticated requests to `POST /orders` are rejected
- [ ] Missing/invalid FR-013 fields return `400`
- [ ] Valid payload persists required fields and creates order
- [ ] Tests passing

### 2) FR-020: Support client-selected booster on order creation

## Task
Implement client booster selection in order flow.

## Why
Requirement FR-020 states client can select a booster; current order flow does not enforce or persist this behavior end-to-end.

## Steps
- [ ] Add `boosterId` support in create-order input
- [ ] Validate selected booster exists and has booster role/eligibility
- [ ] Persist `boosterId` in order aggregate/repository
- [ ] Add use-case and integration tests for valid/invalid booster selection

## Done When
- [ ] Client can submit `boosterId` during order creation
- [ ] Invalid booster selection throws domain/application error
- [ ] Selected booster is persisted on order
- [ ] Tests passing

### 3) FR-016: Calculate and expose subtotal before payment

## Task
Implement subtotal calculation and quote response before payment creation.

## Why
FR-016 requires subtotal calculation and display before payment; current flow has no pricing calculation in create-order.

## Steps
- [ ] Create pricing calculation service/use-case for order quote
- [ ] Integrate subtotal calculation into create-order flow
- [ ] Persist `subtotal`/`totalAmount` on order
- [ ] Return pricing values in create-order response
- [ ] Add unit + integration tests for pricing scenarios

## Done When
- [ ] `POST /orders` returns computed subtotal
- [ ] Subtotal/total are persisted in DB
- [ ] Invalid pricing inputs are rejected with `400`
- [ ] Tests passing

### 4) FR-017: Apply coupon codes at checkout

## Task
Implement coupon application during checkout/order pricing.

## Why
FR-017 requires coupon support at checkout; current order/payment flow does not apply coupon effects.

## Steps
- [ ] Add coupon input and validation in checkout/create-order flow
- [ ] Apply coupon discount to pricing composition
- [ ] Persist `couponId` and `discountAmount` on order
- [ ] Add tests for valid, invalid, and disabled coupon cases

## Done When
- [ ] Valid coupon reduces final amount correctly
- [ ] Invalid/disabled coupon is rejected
- [ ] Coupon and discount are persisted on order
- [ ] Tests passing

### 5) FR-018 + FR-035..FR-050: Extras and deterministic pricing modifiers

## Task
Implement extras selection with deterministic pricing modifier engine and post-finalization lock.

## Why
Requirements define 10+ priced extras, 5 zero-cost extras, deterministic modifiers, and immutability after finalization; these rules are not implemented in current order logic.

## Steps
- [ ] Define extras catalog and pricing modifier rules
- [ ] Implement deterministic modifier calculation over base subtotal
- [ ] Persist selected extras and computed extra prices
- [ ] Enforce extras immutability after order finalization state
- [ ] Add unit and integration tests for modifier combinations and lock behavior

## Done When
- [ ] Extras are selectable and persisted on order
- [ ] Price modifiers are deterministic and reproducible
- [ ] Extras cannot be changed after finalization
- [ ] Tests passing

### 6) FR-026: Support payment methods (Credit Card, PIX, Boleto)

## Task
Implement payment method selection and persistence in payment creation flow.

## Why
FR-026 requires support for card, PIX, and boleto; current payment model/use-cases do not expose method choice.

## Steps
- [ ] Add payment method enum and request field to create-payment flow
- [ ] Persist selected method and validate allowed values
- [ ] Adjust API contracts/tests to include payment method
- [ ] Add integration tests per supported method

## Done When
- [ ] Payment creation accepts card/PIX/boleto
- [ ] Selected method is persisted and retrievable
- [ ] Unsupported method is rejected
- [ ] Tests passing

### 7) FR-029 + FR-030 + FR-031: Wallet withdrawals and configurable lock period automation

## Task
Implement withdrawal flow with lock-period-based automatic release.

## Why
Requirements mandate no minimum withdrawal, delayed unlock, and automatic release after lock expiration; current API has payment release endpoint but no wallet/withdrawal domain workflow.

## Steps
- [ ] Implement wallet domain/use-cases for locked vs withdrawable balances
- [ ] Add configurable lock period setting for completed-order earnings
- [ ] Implement worker job to release locked funds after expiry
- [ ] Implement withdrawal request use-case without minimum amount constraint
- [ ] Add unit/integration tests for lock and release timeline behavior

## Done When
- [ ] Booster earnings enter locked balance on completion
- [ ] Funds become withdrawable automatically after configured lock period
- [ ] Withdrawal request works without minimum threshold
- [ ] Tests passing

### 8) FR-033 + NFR-007: Explicit credential deletion on unconfirmed/failed payment paths

## Task
Implement explicit credential cleanup when payment is not confirmed or payment fails/rolls back.

## Why
FR-033 requires credential deletion when payment is not confirmed, and NFR-007 requires least-retention for sensitive data. Current flow blocks pre-confirm storage but lacks explicit cleanup path for unconfirmed/failed scenarios.

## Steps
- [ ] Define payment failure/unconfirmed timeout transition/use-case
- [ ] Add credential deletion trigger on these negative payment states
- [ ] Persist and expose the resulting order/payment states
- [ ] Add tests for retry/failure/idempotent cleanup behavior

## Done When
- [ ] Failed/unconfirmed payment path removes stored credentials
- [ ] Cleanup is idempotent and safe on retries
- [ ] No credentials remain after negative payment finalization
- [ ] Tests passing
