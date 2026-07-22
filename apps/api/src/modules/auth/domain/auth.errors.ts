import {
	ForbiddenDomainError,
	UnauthorizedDomainError,
} from '@app/common/errors/domain.error';

export class AuthenticationRequiredError extends UnauthorizedDomainError {
	constructor() {
		super('Authentication required.');
	}
}

export class InvalidAccessTokenError extends UnauthorizedDomainError {
	constructor() {
		super('Invalid access token.');
	}
}

export class InternalApiKeyRequiredError extends UnauthorizedDomainError {
	constructor() {
		super('Internal API key required.');
	}
}

export class InvalidInternalApiKeyError extends UnauthorizedDomainError {
	constructor() {
		super('Invalid internal API key.');
	}
}

export class InsufficientPermissionsError extends ForbiddenDomainError {
	constructor() {
		super('Insufficient permissions.');
	}
}

export class AuthInvalidCredentialsError extends UnauthorizedDomainError {
	constructor() {
		super('Invalid credentials.');
	}
}

export class AuthUserInactiveError extends ForbiddenDomainError {
	constructor() {
		super('Account is inactive.');
	}
}

export class AuthUserBlockedError extends ForbiddenDomainError {
	constructor() {
		super('Account is blocked.');
	}
}

export class AuthRefreshTokenInvalidError extends UnauthorizedDomainError {
	constructor() {
		super('Invalid refresh token.');
	}
}

export class AuthRefreshTokenRevokedError extends UnauthorizedDomainError {
	constructor() {
		super('Refresh token has been revoked.');
	}
}
