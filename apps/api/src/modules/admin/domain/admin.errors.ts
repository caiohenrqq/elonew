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
