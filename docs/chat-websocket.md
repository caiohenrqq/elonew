# Chat WebSocket Contract

## Scope

Issue `#51` adds authenticated Socket.IO delivery for persisted order chat.
The persisted REST chat API remains the source of truth for history, reconnect
recovery, and authorization rules.

## Connection

- Namespace: `/chat`
- Allowed browser origins: configured by API `CHAT_SOCKET_ALLOWED_ORIGINS`
  as a comma-separated list.
- Authentication: existing JWT access token passed as either:
  - Socket.IO `auth.token`
  - `Authorization: Bearer <token>` handshake header
- Browser dashboard connections may instead rely on the existing
  `elonew.session` httpOnly cookie. The API must use the same
  `WEB_SESSION_SECRET` as the web app for that cookie path.
- Allowed roles: `CLIENT`, `BOOSTER`
- Admin realtime monitoring is not part of this contract.

## Client Events

- `chat:join`
  - Payload: `{ "orderId": "<order-id>" }`
  - Authorizes the current user against the order chat and joins the socket to
    the order chat room.
- `chat:leave`
  - Payload: `{ "orderId": "<order-id>" }`
  - Leaves the order chat room.
- `chat:send`
  - Payload: `{ "orderId": "<order-id>", "content": "<message>" }`
  - Persists the message through the same chat send use-case used by REST, then
    broadcasts the persisted message.

## Server Events

- `chat:joined`
  - Payload: `{ "orderId": "<order-id>" }`
- `chat:left`
  - Payload: `{ "orderId": "<order-id>" }`
- `chat:message.created`
  - Payload: existing `ChatMessageResponse`
- `chat:error`
  - Payload: `{ "code": "<code>", "message": "<safe message>" }`
  - Error codes: `AUTHENTICATION_REQUIRED`, `INVALID_ACCESS_TOKEN`,
    `INSUFFICIENT_PERMISSIONS`, `NOT_FOUND`, `NOT_WRITABLE`,
    `VALIDATION_ERROR`, `INTERNAL_ERROR`

## MVP Constraints

- Delivery is in-process only; no Redis Socket.IO adapter yet.
- Clients must rejoin rooms after reconnecting.
- Missed messages are recovered by reading persisted REST chat history.
- Web dashboard token bridging for httpOnly cookies is outside this backend
  issue; browser clients use credentialed cookie handshakes instead of reading
  JWTs.
