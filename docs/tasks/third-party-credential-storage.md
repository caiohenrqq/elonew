# Order Credentials Hardening

Final scope, decided 2026-07-21. Earlier drafts of this document described a
KMS-based (then RSA-envelope-based) store with a worker-only decrypt boundary. That
design assumed an automated machine-to-machine consumer. This codebase's credentials
are League account logins (`OrderCredentials`: login / summonerName / password) whose
eventual consumer is a human booster reading them through the API — so the API must
be able to decrypt, and the asymmetric API/worker key split is inapplicable. The
decision was to harden the existing order-credentials flow instead.

## Threat model

Protects against: database dumps, leaked backups, leaked DB credentials, read-only
SQL injection, and ciphertext being moved between rows/fields.

Does not protect against: compromise of the API runtime or its encryption key
(`ORDER_CREDENTIALS_ENCRYPTION_KEY`), or capture before encryption. This is an
explicit, accepted tradeoff — the read path requires API-side decryption.

## What was implemented (2026-07-21)

### v2 sealed format with AAD

`OrderCredentialsCipherService` (orders module, infrastructure/security) now produces
`v2:<iv>:<tag>:<ciphertext>` values, AES-256-GCM with additional authenticated data
`order-credentials:<orderId>:<field>`. v2 ciphertext copied to another order or field
fails authentication. Encryption rejects empty values and empty order ids (an order
id must exist before sealing, since the AAD binds to it — this also blocks the
`create()`-with-generated-id trap where credentials would be sealed under the wrong
AAD). Decryption accepts any segment layout the encryptor can produce and rejects
malformed payloads.

Reads originally also accepted `v1:` values (pre-AAD) and raw plaintext
(pre-encryption legacy). Both fallbacks were removed on 2026-07-26 once production
held no such rows (see "Legacy fallbacks removed" below). Same env key as before; no
schema change.

### Plaintext no longer round-trips

Previously every order load decrypted credentials into the `Order` entity and every
save re-encrypted them. Now:

- The entity holds plaintext only when freshly submitted (`setCredentials` →
  `pendingCredentials`); rehydration from the database carries just a
  `hasStoredCredentials` flag. Sealed values are never decrypted on load.
- `PrismaOrderRepository.save` writes credentials only when `pendingCredentials` is
  set; an unmodified order leaves the stored row untouched (no decrypt/re-encrypt
  churn, and each field is sealed exactly once per save instead of twice).
- `complete()`, `cancel()`, and `clearCredentials()` clear both, and save deletes the
  row. Cancellation cleanup is new: previously a client who paid, submitted
  credentials, then cancelled left the encrypted row on a terminal order forever.
- `save()` runs the credentials delete and the order upsert in one transaction, so a
  transient upsert failure can no longer strand an active order with its credentials
  already deleted.
- The only paths that decrypt are the booster reveal endpoint and the booster
  dashboard's `summonerName` fallback (used when the mirrored order column is empty).

### Lifecycle

Credentials are stored only after payment confirmation, deleted on payment failure
(payments cleanup adapter), on order completion, and on order cancellation, and
cascade-deleted with the order. Every terminal order state now clears credentials;
order state is the expiry mechanism and no separate TTL was added.

## Booster read path (2026-07-26, #104)

`GET /orders/:orderId/credentials/reveal` returns the decrypted credentials to the
booster assigned to an `in_progress` order, and nothing else does:

- Authorization is part of the query (`id` + `boosterId` + status), so a foreign
  order and a missing one both answer 404 — the endpoint confirms nothing about
  orders that are not the caller's. A matching order whose client has not submitted
  credentials answers 404 with a distinct message.
- Decryption stays in `PrismaOrderRepository.findCredentialsForBooster`; the entity
  still rehydrates with only `hasStoredCredentials`. Credentials never appear in
  list or detail responses.
- Every reveal writes an `order_credential_reveals` row (order, booster, timestamp —
  no values) and emits a typed `order.credentials_reveal` log event that has no field
  able to carry a credential value. The audit write is awaited *before* the plaintext
  is returned, so a reveal that cannot be recorded does not happen; the row cascades
  only with the order, outliving the credentials row destroyed at termination.
- The route carries its own throttle (`ORDERS_CREDENTIALS_REVEAL_THROTTLE_LIMIT`,
  default 10/min) because the global throttler only covers mutations.

## Legacy fallbacks removed (2026-07-26, #104)

`decryptField` now accepts only well-formed `v2:` payloads and throws on anything
else, including `v1:` and raw plaintext. Verified beforehand that production held 1
credentials row and 0 non-`v2:` values, and that the deployed image (v0.12.0, after
the hardening shipped) can no longer write legacy values. A non-`v2:` value now means
tampering or corruption, and the dashboard `summonerName` fallback throws rather than
rendering it — deliberately loud instead of silently degrading.

## Known limitations (accepted)

- Deleting the row does not scrub historical database backups; the env key decrypts
  any backup containing ciphertext. Mitigations: short backup retention, restricted
  backup access, key rotation (v2 format is versioned; a v3 can change keys).
- No reveal counter or anomaly detection yet; the audit table makes it queryable when
  wanted.
- Booster dashboard UI for the reveal is not built; the endpoint has no caller in
  `apps/web` yet.
- Disable request-body logging for the save/reveal routes if request logging is ever
  added.

## Verification

- Unit: cipher round-trip, cross-order/cross-field AAD rejection, tamper rejection,
  v1/plaintext rejection; reveal use case (authorization, audit-before-return,
  no credential values in the log event); repository
  seals-once/leaves-stored-untouched/deletes; entity credential state transitions.
  (`apps/api`, orders module specs)
- E2E: reveal for the assigned booster, 404 for another booster, 403 for a client,
  401 anonymous, 429 past the route limit, and no credentials in the detail response.
- DB integration: `orders.db.integration` asserts stored values are `v2:` sealed,
  never plaintext, deleted on completion, rejected before payment confirmation, plus
  the reveal round-trip and its audit row surviving completion.
