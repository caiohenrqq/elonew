import { BadRequestDomainError } from '@app/common/errors/domain.error';

// Sign-up must not confirm whether an email or username exists, so both report
// the same opaque reason to the client while keeping the real one for logs.
const REGISTRATION_UNAVAILABLE = 'Registration is unavailable.';

export class UserEmailAlreadyInUseError extends BadRequestDomainError {
	constructor() {
		super('User email is already in use.');
	}

	override get httpMessage(): string {
		return REGISTRATION_UNAVAILABLE;
	}
}

export class UsernameAlreadyInUseError extends BadRequestDomainError {
	constructor() {
		super('Username is already in use.');
	}

	override get httpMessage(): string {
		return REGISTRATION_UNAVAILABLE;
	}
}

export class UserEmailConfirmationTokenInvalidError extends BadRequestDomainError {
	constructor() {
		super('Invalid confirmation token.');
	}
}

export class UserPasswordResetTokenInvalidError extends BadRequestDomainError {
	constructor() {
		super('Invalid password reset token.');
	}
}
