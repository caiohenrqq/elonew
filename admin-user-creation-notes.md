# Admin User Creation Notes

Remember to create a new branch to start working on. 

## Current Understanding

- Admins need a panel flow to create users without setting a password.
- The admin creation form should collect only basic user info:
  - username
  - email
  - role: `CLIENT`, `ADMIN`, or `BOOSTER`
- After creation, the created user should receive an email link that lets them set their own password.
- Until the created user completes that email/password activation flow, the admin panel should show the account as inactive.
- The admin user list should show important user data, at minimum:
  - username
  - email
  - role
  - activation status
  - blocked status
  - created date
- The action must be auditable.
- The action must emit structured lifecycle logs.

## Existing Repo Facts

- Roles already exist as `CLIENT`, `BOOSTER`, and `ADMIN`.
- `users` already has:
  - `isActive`
  - `emailConfirmedAt`
  - `emailConfirmationTokenHash`
  - `emailConfirmationTokenExpiresAt`
  - `createdAt`
  - `role`
  - `isBlocked`
- There is already an email confirmation flow for public signup.
- Admin user listing already returns `createdAt`, `role`, `isActive`, and `isBlocked`.
- There is already an `admin_governance_actions` table used for admin audit actions.
- Ponytail read: prefer extending the existing user activation/email confirmation and admin governance paths instead of adding a separate audit table unless the new action needs fields the existing table cannot represent.

## Likely Smallest Implementation Shape

- Add an admin-only API endpoint to create a user.
- Reuse the existing email confirmation token mechanism as the activation link, unless the product really needs a separate "reset password" token.
- Store the user as inactive until the link is completed.
- Record an admin governance action like `USER_CREATE`.
- Add one structured lifecycle log event for the admin-created-user workflow.
- Add the admin panel form and wire it to the new endpoint.
- Extend the admin user table only if the current fields are not enough visually.

## Open Questions

1. Should the email link be the existing email confirmation flow, or must it be a separate "set/reset password" flow?
	R: It must be a new set/reset password. Try to match the aspect of confirmation flow, if needed create a source of truth of design of emails.
2. Since admins do not set a password, should the database allow `users.password` to be nullable, or should we store a random unusable hash until activation?
	R: It should be nullable. And nullable should not mean that a hacker log in with email and null password and pass through.
3. What exact "basic info" should admins enter besides username, email, and role?
	R: I really don't know. But you don't need to create anything: It's literally just the basic, username email and role. If our database needs something different, please ask to me.
4. For `BOOSTER` users, should admin creation also create or require any booster-specific profile/invite data?
	R: Simple option.
5. Can admins create other `ADMIN` users directly, or should that require an extra confirmation/reason?
	R: No confrimation/reason.
6. Should duplicate email/username behave exactly like public signup errors?
	R: Yes, the API should clearly return duplication exception and the UI should clearly say that we already has a username/email like that. (if email and username isn't unique; it should be).
7. What should happen if the activation email fails to send after the user is created: keep the inactive user, roll back creation, or allow resend from admin panel?
	R: The e-mail should only happen if the user is successfuly created; if the email fails, it should create, and allow re-send from admin-panel.
8. Should admins be able to resend the activation/set-password email for inactive users?
	R: Yes. Inactive isn't a kind of bad sign. It's just: Ok this user is off OR this user hasn't confirmed yet.
9. Should the admin audit record require a human-entered reason for user creation, or is actor/action/target/timestamp enough?
	R: actor/action/target/timestamp enough?
10. Do you want the audit visible in the admin UI now, or only persisted for investigation/logging?
	R: only persisted by investigation/logging.
11. Should inactive users be unable to log in because `isActive = false` only, or should there be a clearer status label like `PENDING_ACTIVATION`?
	R: Ohh okay, that is a great question. Maybe my earlier questions overlap with that, so keep with this one: It must ha inactive and pending_activation, both should not let user log in, and show the same generic error (something like isn't possible to log in, please try again).
	It's important to be direct.
12. What email copy/language should be used: Portuguese only, English only, or follow the current app language?
	R: portuguese.

## Verification To Run Later

- `pnpm biome:fix:all`
- API typecheck for touched package
- Web typecheck/build for touched package
- Targeted API tests for admin user creation
- Targeted web tests for admin panel create-user flow
- Database-backed test if the Prisma schema changes
