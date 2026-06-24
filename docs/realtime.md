# Realtime Contracts

Persisted REST APIs are authoritative. Socket.IO provides live delivery; clients
refetch persisted state after initial connection and reconnect.

## Authentication

- API origin comes from `NEXT_PUBLIC_API_URL`.
- Browser dashboards use the `elonew.session` httpOnly cookie.
- Non-browser clients may use `auth.token` or an `Authorization` bearer header.
- API and web share `WEB_SESSION_SECRET`.
- Cross-subdomain cookies use `WEB_SESSION_COOKIE_DOMAIN=.elonew.com.br`.

## Chat

Namespace: `/chat`

Roles: `CLIENT`, `BOOSTER`

Client events:

- `chat:join`: `{ "orderId": "<order-id>" }`
- `chat:leave`: `{ "orderId": "<order-id>" }`
- `chat:send`: `{ "orderId": "<order-id>", "content": "<message>" }`

Server events:

- `chat:joined`
- `chat:left`
- `chat:message.created`
- `chat:error`

Messages are persisted before broadcast. Missed messages are recovered from chat
history.

## Notifications

Namespace: `/notifications`

Roles: `CLIENT`, `BOOSTER`, `ADMIN`

Server events:

- `notifications:connected`
- `notifications:updated`
- `notifications:read-all`
- `notifications:error`

`notifications:read-all` applies only to local items with
`activityAt <= cutoffActivityAt`; newer items remain unread.

## Current scaling constraint

Delivery is in-process. Cross-instance delivery is tracked in GitHub issue #76.
