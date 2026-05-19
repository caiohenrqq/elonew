# Notifications WebSocket Contract

## Scope

Issue `#64` adds authenticated Socket.IO delivery for persisted in-platform
notifications. The persisted REST API remains the source of truth for
notification history, unread counts, reconnect recovery, and authorization.

Notifications are in-platform only. Email, Discord, push, SMS, and external
provider delivery are out of scope.

## Connection

- Namespace: `/notifications`
- Allowed browser origins: configured by the same API Socket.IO adapter path
  used for dashboard sockets.
- Authentication: existing JWT access token passed as either:
  - Socket.IO `auth.token`
  - `Authorization: Bearer <token>` handshake header
- Browser dashboard connections may instead rely on the existing
  `elonew.session` httpOnly cookie. Browser JavaScript must not read JWTs.
- Allowed roles: `CLIENT`, `BOOSTER`, `ADMIN`

## Server Events

- `notifications:connected`
  - Payload: `{ "userId": "<user-id>" }`
- `notifications:updated`
  - Payload:
    `{ "notification": <NotificationResponse>, "unreadCount": <number> }`
  - Emitted only to the authenticated recipient's room.
- `notifications:read-all`
  - Payload:
    `{ "readAt": "<iso-date>", "cutoffActivityAt": "<iso-date>", "unreadCount": <number> }`
  - Emitted only to the authenticated recipient's room after explicit
    mark-all-read actions.
- `notifications:error`
  - Payload: `{ "code": "<code>", "message": "<safe message>" }`
  - Error codes: `AUTHENTICATION_REQUIRED`, `INVALID_ACCESS_TOKEN`,
    `INSUFFICIENT_PERMISSIONS`, `INTERNAL_ERROR`

## MVP Constraints

- Delivery is in-process only; no Redis Socket.IO adapter yet.
- REST remains authoritative after reconnect.
- Browser clients must refetch `GET /notifications` after initial socket
  connection and reconnect.
- Browser clients must apply `notifications:read-all` only to local items with
  `activityAt <= cutoffActivityAt`; newer items remain unread.
- Chat notifications are coalesced per recipient and order.
- Read state changes only through explicit REST read actions.
- Browser clients use the `elonew.session` httpOnly cookie handshake and must
  not read JWTs.
- Production deployments with separate web/API subdomains must set
  `NEXT_PUBLIC_API_URL`, `CHAT_SOCKET_ALLOWED_ORIGINS`, shared
  `WEB_SESSION_SECRET`, and `WEB_SESSION_COOKIE_DOMAIN` so the httpOnly session
  cookie is sent during the Socket.IO handshake.
