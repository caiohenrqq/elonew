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

export class InternalApiKeyRequiredError extends Error {
	constructor() {
		super('Internal API key required.');
	}
}

export class InvalidInternalApiKeyError extends Error {
	constructor() {
		super('Invalid internal API key.');
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

export class AuthUserBlockedError extends Error {
	constructor() {
		super('Account is blocked.');
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
