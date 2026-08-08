# Privacy and Retention

## Covered data

- Order chat and messages
- Support tickets and messages
- Notification metadata referencing user activity
- Withdrawal payout PIX keys, which may contain a CPF, CNPJ, phone number,
  email address, or random EVP key

Order credentials follow the product credential lifecycle in
`docs/requirements.md`.

`Order.summonerName` is retained for the life of the order record. It is a
public in-game identifier collected before payment, and it is deliberately not
wiped with the encrypted credentials when an order completes or is cancelled —
support, disputes, and account lookups need it after the login and password are
destroyed.

## Current policy

- Chat and support history remain while their account and order records remain.
- No automatic chat or ticket retention window is implemented.
- Attachments are not supported.
- Clients and boosters access only their own records.
- Admin access exists for support, moderation, and governance.
- Withdrawal PIX keys remain attached to financial ledger records, are visible
  only to admins for payout operations, and are not returned in the booster's
  general transaction history.
- No automatic withdrawal PIX-key retention or erasure window is implemented.
- Authorization is enforced by the API.

## Forbidden handling

- Never delete production records ad hoc for an erasure request.
- Preserve required financial, payment, dispute, governance, and audit records.
- Remove or anonymize identifying support content only through a reviewed
  operational workflow.

Explicit retention windows, export workflows, and erasure workflows must be
implemented before processing formal data-subject requests.
