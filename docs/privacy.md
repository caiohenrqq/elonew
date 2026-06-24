# Privacy and Retention

## Covered data

- Order chat and messages
- Support tickets and messages
- Notification metadata referencing user activity

Order credentials follow the product credential lifecycle in
`docs/requirements.md`.

## Current policy

- Chat and support history remain while their account and order records remain.
- No automatic chat or ticket retention window is implemented.
- Attachments are not supported.
- Clients and boosters access only their own records.
- Admin access exists for support, moderation, and governance.
- Authorization is enforced by the API.

## Forbidden handling

- Never delete production records ad hoc for an erasure request.
- Preserve required financial, payment, dispute, governance, and audit records.
- Remove or anonymize identifying support content only through a reviewed
  operational workflow.

Explicit retention windows, export workflows, and erasure workflows must be
implemented before processing formal data-subject requests.
