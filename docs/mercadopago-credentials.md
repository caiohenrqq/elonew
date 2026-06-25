# Generating MercadoPago credentials (production)

This project integrates MercadoPago via **Checkout Pro**. At checkout the API
creates a *Preference* and redirects the buyer to its `init_point`; payment
results arrive through a signed webhook.

Two secrets are required in `infrastructure/docker/prod/api.env`:

| Env var | What it is | Where it comes from |
| --- | --- | --- |
| `MERCADO_PAGO_ACCESS_TOKEN` | Production access token (`APP_USR-…`) | App → Production credentials |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Webhook signing secret | App → Webhooks → secret |

`MERCADO_PAGO_WEBHOOK_URL` must be
`https://api.elonew.com.br/payments/webhooks/mercadopago` (no `/api` — the API
has no global prefix). The current value on the VPS has a wrong `/api` segment;
fix it in the same edit.

## 1. Create / open the application

1. Sign in at <https://www.mercadopago.com.br/developers> with the **business
   account that will receive the money** (not a personal/test buyer account).
2. Go to **Suas integrações → Criar aplicação** (or open the existing one).
3. Product: choose **Pagamentos online → Checkout Pro**. This matters — the
   code calls the Preference API, which is the Checkout Pro flow.

## 2. Get the production access token

1. Inside the app: **Credenciais de produção**.
2. If it's the first time, complete the short "homologação" form MercadoPago
   asks for to unlock production.
3. Copy the **Access token** — it starts with `APP_USR-`.
   - The **Test** token (`TEST-…`) will make `createPayment` reject and the
     `/payments/checkout` endpoint return 500. Use production only on the VPS.
   - The Public Key is **not** used by this backend; you can ignore it.

→ `MERCADO_PAGO_ACCESS_TOKEN=APP_USR-…`

## 3. Configure the webhook and get the signing secret

The app verifies every webhook with HMAC-SHA256 over the manifest
`id:<resource>;request-id:<id>;ts:<ts>;` using this secret
(`mercadopago-sdk.adapter.ts` → `verifyWebhookSignature`). A wrong/empty secret
makes valid webhooks fail signature checks and payments never confirm.

1. In the app: **Webhooks → Configurar notificações** (production / "Modo
   produtivo").
2. **URL:** `https://api.elonew.com.br/payments/webhooks/mercadopago`
   (must match `MERCADO_PAGO_WEBHOOK_URL` exactly).
3. **Eventos:** enable **Pagamentos** (`payment`). That's the only topic the
   handler processes.
4. Save, then copy the generated **Assinatura secreta / secret**.

→ `MERCADO_PAGO_WEBHOOK_SECRET=<secret>`

## 4. Install on the VPS

Edit the file directly (keeps secrets out of shell history):

```bash
ssh elonew-vps
nano /opt/elonew/elonew/infrastructure/docker/prod/api.env
```

Replace the two placeholder lines (no quotes, no spaces around `=`, no trailing
spaces):

```
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-…
MERCADO_PAGO_WEBHOOK_SECRET=…
```

Recreate the containers that read `api.env` (values are not hot-reloaded):

```bash
cd /opt/elonew/elonew/infrastructure/docker/prod
docker compose up -d api workers
```

## 5. Verify

Lengths only, no secrets printed (both should no longer be `28` — the
placeholder length):

```bash
awk -F= '/^MERCADO_PAGO_(ACCESS_TOKEN|WEBHOOK_SECRET)/{v=$0;sub(/^[^=]*=/,"",v);print $1, length(v)}' \
  /opt/elonew/elonew/infrastructure/docker/prod/api.env
```

Then run a real checkout and confirm:

- `POST /payments/checkout` returns a `checkoutUrl` (no 500).
- After paying, the MercadoPago webhook hits the API and the order moves off
  `pending` — check `PaymentLifecycleLogger` logs for `outcome: success`.

## Notes

- Supported methods are pix, credit_card, boleto (`buildExcludedPaymentTypes`).
- Local/dev never calls MercadoPago: `SKIP_MERCADO_PAGO_CHECKOUT_IN_DEV_MODE=true`
  selects the dev gateway, so these credentials are a production-only concern.
- Rotating credentials later = repeat steps 4–5 with the new values.
