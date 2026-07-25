# Observability Rules

This document is the project source of truth for production observability.
Observability code is product code. It must be reviewed with the same bar as
business logic because operators depend on it during incidents.

## Goals

Every important production event must answer these questions without reading
code or reproducing the issue:

- What operation ran?
- Which customer, order, payment, job, provider object, or aggregate was
  involved?
- What state existed before and after the operation?
- Which external dependency or provider was involved?
- Which side effects were attempted or completed?
- Did the operation succeed, fail, or intentionally skip work?
- How long did it take?
- Which deployment, environment, request, or job execution produced it?

## Logging Contract

- Logs must be structured JSON objects.
- Logs must be emitted through the configured project logger. In the API this is
  `nestjs-pino` through `LoggingModule`.
- Feature code must not use `console.log`, unstructured string logs, or ad hoc
  logger instances.
- Every application workflow with business impact must emit one lifecycle event
  at completion.
- Lifecycle events must be emitted in `finally` so success, failure, and skipped
  outcomes are all visible.
- Request middleware logs are transport logs. They do not replace lifecycle
  events for payment, order, wallet, auth, support, notification, or worker
  workflows.
- Domain entities must not log. Controllers should not log business lifecycle
  events. Use-cases, workers, or dedicated application logging helpers own those
  events.
- Shared logging logic must be centralized per feature or cross-cutting concern.
  Do not duplicate duration calculation, error normalization, log-level
  selection, or sensitive-field redaction across use-cases.

## Required Base Fields

Every lifecycle event must include:

```text
event
operation
outcome
duration_ms
```

Field meanings:

- `event`: stable event family, for example `payment.lifecycle`.
- `operation`: stable operation within the event family, for example
  `mercadopago_webhook`.
- `outcome`: exactly one of `success`, `error`, or `skipped`.
- `duration_ms`: integer elapsed time for the operation.

Error lifecycle events must also include:

```text
error_type
error_message
```

Use domain error class names for `error_type`. Keep `error_message` free of
secrets, credentials, tokens, raw provider payloads, and private customer data.

## Field Naming

- Use `snake_case` field names.
- Use explicit id fields: `user_id`, `client_id`, `booster_id`, `order_id`,
  `payment_id`, `wallet_id`, `ticket_id`, `job_id`.
- Use provider-prefixed fields for external identifiers:
  `gateway_payment_id`, `gateway_reference_id`, `webhook_request_id`.
- Use status fields with direction when a state transition can occur:
  `payment_status_before`, `payment_status_after`,
  `order_status_before`, `order_status_after`.
- Use booleans for presence checks instead of logging sensitive values:
  `checkout_url_present`, `credentials_present`, `token_present`.
- Use arrays for completed side effects:
  `side_effects: ["order_marked_paid"]`.

Do not rename fields per feature for the same concept. Queryability is more
important than local naming preference.

## Required Business Context

Lifecycle events must include all applicable business identifiers and decision
inputs:

- Actor ids: `client_id`, `booster_id`, `admin_user_id`, `user_id`.
- Aggregate ids: `order_id`, `payment_id`, `wallet_id`, `ticket_id`.
- Money fields needed for support and reconciliation:
  `gross_amount`, `booster_amount`, `wallet_amount`, `discount_amount`.
- Statuses and transitions:
  `*_status_before`, `*_status_after`, and relevant related status fields.
- External provider context:
  `gateway`, `gateway_status`, `gateway_status_detail`,
  `gateway_payment_id`, `gateway_reference_id`.
- Idempotency and replay context:
  idempotency key, processed key, duplicate/skipped flag, retry attempt.
- Side effects:
  order state changes, credential cleanup, wallet ledger writes, notifications,
  emails, queued jobs, provider calls.

If a developer would need a field to debug a real failed customer flow, the
field belongs in the lifecycle event unless it is sensitive.

## Forbidden Data

Never log:

- passwords
- order credentials
- JWTs, refresh tokens, session cookies, API keys, webhook secrets
- raw `Authorization`, `Cookie`, `Set-Cookie`, or `x-signature` values
- raw payment card data or card tokens
- full checkout URLs when a presence boolean is enough
- raw provider payloads unless a redacted allowlist is explicitly defined
- private support message bodies unless the log event is specifically approved
  for content moderation or abuse workflows

When in doubt, log an id, count, status, or boolean instead of the value.

## Levels

Use only:

- `info` for `success` and `skipped` lifecycle events.
- `error` for lifecycle events with `outcome: "error"`.

Do not use warning/debug logs for normal business workflows. If an event matters
in production, it must be queryable at `info` or `error` with enough context.
Collectors may preserve Pino's numeric `level` while adding normalized
`detected_level` and `severity_text` metadata for log backends and UIs.

## Correlation

- HTTP logs must include the request id generated from `x-request-id` or a new
  UUID.
- Provider callbacks must include provider request ids, for example
  `webhook_request_id`.
- Worker lifecycle events must include `job_id`, queue name, attempt number, and
  dedupe/idempotency keys.
- Cross-system calls must propagate request or operation ids when the target
  system supports it.

## Feature Implementation Pattern

Each complex feature must provide a small logging helper under its application
boundary when it has more than one use-case emitting the same event family.

Required helper responsibilities:

- Define the event type and allowed operations.
- Normalize errors into `error_type` and `error_message`.
- Set `duration_ms`.
- Select `info` or `error`.
- Prevent sensitive fields from being accepted in the event contract.

Use-cases may only:

- create the event object
- attach business context as it becomes available
- set `outcome`
- call the helper in `finally`

## Payment Lifecycle Event

Payment operations must use the `payment.lifecycle` event family.

Allowed operations:

```text
create
resume_checkout
confirm
fail
release_hold
simulate_dev_outcome
mercadopago_webhook
```

Payment lifecycle events must include every available applicable field:

```text
event
operation
outcome
duration_ms
client_id
order_id
payment_id
payment_method
payment_status_before
payment_status_after
order_status
gross_amount
booster_amount
gateway
gateway_reference_id
gateway_payment_id
gateway_status
gateway_status_detail
checkout_url_present
webhook_event_id
webhook_topic
webhook_resource_id
webhook_request_id
webhook_signature_valid
webhook_processed_event_key
webhook_already_processed
webhook_resolution
side_effects
error_type
error_message
```

Payment lifecycle logs must not include:

- Mercado Pago access tokens
- webhook secrets
- `x-signature` values
- checkout URLs
- order credentials
- raw Mercado Pago payloads

## Wallet Lifecycle Event

Booster wallet operations must use the `wallet.lifecycle` event family.

Allowed operations:

```text
credit_order_completion
release_order_completion
admin_force_release
```

Wallet lifecycle events must include every available applicable field:

```text
event
operation
outcome
duration_ms
booster_id
order_id
admin_user_id
wallet_amount
released_amount
released_transaction_count
balance_locked_before
balance_locked_after
balance_withdrawable_before
balance_withdrawable_after
available_at
lock_period_hours
release_source
skipped_reason
side_effects
error_type
error_message
```

Rules specific to this family:

- Locked funds only become withdrawable through a release. A release that moved
  no money must be `outcome: "skipped"` with a `skipped_reason`, never a silent
  success: `credit_already_exists`, `wallet_not_found`, `credit_not_found`,
  `already_released`, `not_matured`.
- `released_amount` and the four balance fields are mandatory on a successful
  release. Support and reconciliation depend on them.
- `release_source` records who unlocked the money: `schedule` for the matured
  job, `admin` for a manual override. It must match the `releasedBy` column
  persisted on the wallet transaction.
- The admin override never logs the governance reason. The reason is private
  audit data and lives in `admin_governance_actions`; the event carries
  `admin_user_id` only.

## Wallet Funds Release Job Event

The worker that drives the scheduled release must use the
`wallet_funds_release.lifecycle` event family with operation `process_job`.

```text
event
operation
outcome
duration_ms
job_id
queue_name
attempt
booster_id
order_id
available_at
api_status
api_request_id
error_type
error_message
```

Rules specific to this family:

- One event per attempt, emitted in `finally`, so an invalid payload and an
  exhausted retry are both queryable. A dropped job leaves money locked with
  nobody watching.
- `job_id` is the BullMQ dedupe key (`<booster_id>__<order_id>`), and `attempt`
  is 1-based.
- `api_request_id` is the `x-request-id` the worker sent and the API echoed, so a
  worker line joins the matching API lifecycle event.

## Scheduled Task Event

Recurring work declared in the workers scheduled-task registry must use the
`scheduled_task.lifecycle` event family with operation `run_task`.

```text
event
operation
outcome
duration_ms
task_name
cron
job_id
queue_name
attempt
api_status
api_request_id
error_type
error_message
```

Rules specific to this family:

- One event per attempt, emitted in `finally`. A recurring job that stops working
  is otherwise invisible: nobody watches a schedule that simply goes quiet.
- `cron` is included so a log line explains its own cadence without a deploy
  lookup, and a wrong interval is visible in the data.
- An undeclared task name must fail with `error_type:
  "UnknownScheduledTaskError"` before any HTTP call, and the event must record it.
- `api_request_id` is the `x-request-id` the worker sent and the API echoed, so a
  tick can be joined to the workflow event it triggered.

## Review Checklist

Before merging code that adds or changes a production workflow, verify:

- A lifecycle event exists for the workflow.
- The event is emitted exactly once per use-case/job execution.
- Success, skipped, and error outcomes are observable.
- Duration and error normalization are centralized.
- The event contains business ids, states, provider ids, amounts, and side
  effects needed for production debugging.
- The event contract excludes secrets and private data.
- Field names match this document.
- Tests or type checks cover the logging helper wiring when constructor
  injection or module providers change.
