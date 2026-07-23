import {
	BadRequestDomainError,
	NotFoundDomainError,
} from '@app/common/errors/domain.error';

export class AdminUserNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Admin target user not found.');
	}
}

export class AdminOrderNotFoundError extends NotFoundDomainError {
	constructor() {
		super('Admin target order not found.');
	}
}

export class AdminGovernanceReasonRequiredError extends BadRequestDomainError {
	constructor() {
		super('Admin governance reason is required.');
	}
}

export class AdminUserEmailAlreadyInUseError extends BadRequestDomainError {
	constructor() {
		super('User email is already in use.');
	}
}

export class AdminUsernameAlreadyInUseError extends BadRequestDomainError {
	constructor() {
		super('Username is already in use.');
	}
}

export class AdminUserPasswordSetupUnavailableError extends BadRequestDomainError {
	constructor() {
		super('Password setup is unavailable for this user.');
	}
}

export class AdminSelfRoleChangeError extends BadRequestDomainError {
	constructor() {
		super('Admins cannot change their own account type.');
	}
}

export class AdminSelfBlockError extends BadRequestDomainError {
	constructor() {
		super('Admins cannot block their own account.');
	}
}
