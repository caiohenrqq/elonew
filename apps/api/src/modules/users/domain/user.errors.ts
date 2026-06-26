export class UserEmailAlreadyInUseError extends Error {
	constructor() {
		super('User email is already in use.');
	}
}

export class UsernameAlreadyInUseError extends Error {
	constructor() {
		super('Username is already in use.');
	}
}

export class UserEmailConfirmationTokenInvalidError extends Error {
	constructor() {
		super('Invalid confirmation token.');
	}
}

export class UserPasswordResetTokenInvalidError extends Error {
	constructor() {
		super('Invalid password reset token.');
	}
}
