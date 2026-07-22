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

Reads still accept `v1:` values (pre-AAD) and raw plaintext (pre-encryption legacy);
both fallbacks can be dropped once old rows age out — credentials only live from
payment confirmation to order termination, so churn handles migration. Until then be
precise about what the fallbacks cost: v1 rows carry no AAD, so cross-row/cross-field
swaps of v1 ciphertext still decrypt undetected, and the plaintext passthrough
returns any garbled non-`v1:`/`v2:` value as-is instead of erroring (it also means a
DB-write attacker can plant plaintext that "decrypts" — the stated threat model only
covers read access). Same env key as before; no schema change.

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
- Nothing in the API currently decrypts stored credentials; `decryptField` exists for
  the future booster read path.

### Lifecycle

Credentials are stored only after payment confirmation, deleted on payment failure
(payments cleanup adapter), on order completion, and on order cancellation, and
cascade-deleted with the order. Every terminal order state now clears credentials;
order state is the expiry mechanism and no separate TTL was added.

## Known limitations (accepted)

- Deleting the row does not scrub historical database backups; the env key decrypts
  any backup containing ciphertext. Mitigations: short backup retention, restricted
  backup access, key rotation (v2 format is versioned; a v3 can change keys).
- Plaintext/v1 read fallbacks remain until pre-hardening rows are gone (see
  `ponytail:` marker in the cipher service).

## Future work (when the booster read path is built)

- Dedicated endpoint that decrypts on explicit request only, booster-authorized,
  with an audit event per reveal (who, when, which order) and no credential values
  in logs/traces/responses beyond the reveal payload itself.
- Consider a reveal counter for anomaly detection at that point, not before.
- Disable request-body logging for the save/reveal routes if request logging is ever
  added.

## Verification

- Unit: cipher round-trip, cross-order/cross-field AAD rejection, tamper rejection,
  v1 and plaintext fallbacks; repository seals-once/leaves-stored-untouched/deletes;
  entity credential state transitions. (`apps/api`, orders module specs)
- DB integration: `orders.db.integration` asserts stored values are `v2:` sealed,
  never plaintext, deleted on completion, rejected before payment confirmation.
