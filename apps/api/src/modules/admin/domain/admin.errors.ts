export class AdminUserNotFoundError extends Error {
	constructor() {
		super('Admin target user not found.');
	}
}

export class AdminOrderNotFoundError extends Error {
	constructor() {
		super('Admin target order not found.');
	}
}

export class AdminGovernanceReasonRequiredError extends Error {
	constructor() {
		super('Admin governance reason is required.');
	}
}

export class AdminUserEmailAlreadyInUseError extends Error {
	constructor() {
		super('User email is already in use.');
	}
}

export class AdminUsernameAlreadyInUseError extends Error {
	constructor() {
		super('Username is already in use.');
	}
}

export class AdminUserPasswordSetupUnavailableError extends Error {
	constructor() {
		super('Password setup is unavailable for this user.');
	}
}

export class AdminSelfRoleChangeError extends Error {
	constructor() {
		super('Admins cannot change their own account type.');
	}
}

export class AdminSelfBlockError extends Error {
	constructor() {
		super('Admins cannot block their own account.');
	}
}
