export const AUTH_SESSION_REPOSITORY_KEY = Symbol(
	'AUTH_SESSION_REPOSITORY_KEY',
);

export type AuthSessionRecord = {
	id: string;
	userId: string;
	refreshTokenHash: string;
	expiresAt: Date;
	revokedAt: Date | null;
	lastUsedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export interface AuthSessionRepositoryPort {
	findByRefreshTokenHash(tokenHash: string): Promise<AuthSessionRecord | null>;
	create(session: {
		userId: string;
		refreshTokenHash: string;
		expiresAt: Date;
	}): Promise<AuthSessionRecord>;
	save(session: AuthSessionRecord): Promise<void>;
}
