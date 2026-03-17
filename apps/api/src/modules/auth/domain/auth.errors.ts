export class AuthenticationRequiredError extends Error {
	constructor() {
		super('Authentication required.');
	}
}

export class InvalidAccessTokenError extends Error {
	constructor() {
		super('Invalid access token.');
	}
}

export class InsufficientPermissionsError extends Error {
	constructor() {
		super('Insufficient permissions.');
	}
}

export class AuthInvalidCredentialsError extends Error {
	constructor() {
		super('Invalid credentials.');
	}
}

export class AuthUserInactiveError extends Error {
	constructor() {
		super('Account is inactive.');
	}
}

export class AuthRefreshTokenInvalidError extends Error {
	constructor() {
		super('Invalid refresh token.');
	}
}

export class AuthRefreshTokenRevokedError extends Error {
	constructor() {
		super('Refresh token has been revoked.');
	}
}
