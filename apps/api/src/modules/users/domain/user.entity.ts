import { Role } from '@packages/auth/roles/role';

type CreatePendingUserInput = {
	username: string;
	email: string;
	passwordHash: string;
	emailConfirmationTokenHash: string;
	emailConfirmationTokenExpiresAt: Date;
};

type RehydrateUserInput = {
	id: string;
	username: string;
	email: string;
	passwordHash: string;
	role: Role;
	isActive: boolean;
	isBlocked?: boolean;
	emailConfirmedAt: Date | null;
	emailConfirmationTokenHash: string | null;
	emailConfirmationTokenExpiresAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export class User {
	private constructor(
		public readonly id: string,
		public readonly username: string,
		public readonly email: string,
		public readonly passwordHash: string,
		public readonly role: Role,
		public readonly isActive: boolean,
		public readonly isBlocked: boolean,
		public readonly emailConfirmedAt: Date | null,
		public readonly emailConfirmationTokenHash: string | null,
		public readonly emailConfirmationTokenExpiresAt: Date | null,
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
	) {}

	static createPending(input: CreatePendingUserInput): User {
		return new User(
			'',
			input.username,
			input.email,
			input.passwordHash,
			Role.CLIENT,
			false,
			false,
			null,
			input.emailConfirmationTokenHash,
			input.emailConfirmationTokenExpiresAt,
			new Date(),
			new Date(),
		);
	}

	static rehydrate(input: RehydrateUserInput): User {
		return new User(
			input.id,
			input.username,
			input.email,
			input.passwordHash,
			input.role,
			input.isActive,
			input.isBlocked ?? false,
			input.emailConfirmedAt,
			input.emailConfirmationTokenHash,
			input.emailConfirmationTokenExpiresAt,
			input.createdAt,
			input.updatedAt,
		);
	}

	canConfirmEmail(referenceDate: Date): boolean {
		return (
			!this.isActive &&
			this.emailConfirmationTokenHash !== null &&
			this.emailConfirmationTokenExpiresAt !== null &&
			this.emailConfirmationTokenExpiresAt >= referenceDate
		);
	}

	confirmEmail(confirmedAt: Date): User {
		return new User(
			this.id,
			this.username,
			this.email,
			this.passwordHash,
			this.role,
			true,
			this.isBlocked,
			confirmedAt,
			null,
			null,
			this.createdAt,
			confirmedAt,
		);
	}

	block(): User {
		return new User(
			this.id,
			this.username,
			this.email,
			this.passwordHash,
			this.role,
			this.isActive,
			true,
			this.emailConfirmedAt,
			this.emailConfirmationTokenHash,
			this.emailConfirmationTokenExpiresAt,
			this.createdAt,
			new Date(),
		);
	}

	unblock(): User {
		return new User(
			this.id,
			this.username,
			this.email,
			this.passwordHash,
			this.role,
			this.isActive,
			false,
			this.emailConfirmedAt,
			this.emailConfirmationTokenHash,
			this.emailConfirmationTokenExpiresAt,
			this.createdAt,
			new Date(),
		);
	}
}
