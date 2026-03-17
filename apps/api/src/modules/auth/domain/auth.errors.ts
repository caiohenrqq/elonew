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
