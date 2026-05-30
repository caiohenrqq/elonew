# Privacy And Retention

This document captures current privacy and retention expectations for persisted
chat and support data.

## Data Covered

- Order chat history in `Chat` and `ChatMessage`.
- Support history in `Ticket` and `TicketMessage`.
- In-platform notification payloads that reference chat activity.

Order credentials are governed separately by the credential lifecycle rules in
`docs/requirements.md` and the order completion/payment flows.

## Current Retention Policy

- Chat and support history are retained while the related account/order records
  remain active because they are part of operational support history.
- No automatic deletion window is currently implemented for chat or ticket
  history.
- Attachments/proof uploads are out of scope for the current product, so this
  policy only covers persisted text records and notification metadata.

## Access Rules

- Clients and boosters may access only their own order chat and their own
  support tickets.
- Admin access is allowed for support, moderation, and governance workflows.
- Permission checks must remain enforced by the API even when the web UI hides
  actions by role.

## Erasure And Anonymization

- Account erasure or LGPD-style deletion requests should be handled as a
  deliberate operational workflow, not as ad hoc row deletion.
- Before implementing erasure, define how to preserve financial, audit, payment,
  and dispute records while removing or anonymizing user-identifying chat and
  ticket content where legally appropriate.
- Admin governance records and payment/wallet records may need longer retention
  than user-generated support text.

## Follow-Up Work

- Define explicit retention windows after production support workflows stabilize.
- Add audit logging if admin read access to sensitive chat/ticket history needs
  per-access traceability.
- Add export/deletion runbooks before handling real data-subject requests.
