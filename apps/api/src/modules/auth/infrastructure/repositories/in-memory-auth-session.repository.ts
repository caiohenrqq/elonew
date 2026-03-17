import type {
	AuthSessionRecord,
	AuthSessionRepositoryPort,
} from '@modules/auth/application/ports/auth-session-repository.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryAuthSessionRepository
	implements AuthSessionRepositoryPort
{
	private readonly sessions = new Map<string, AuthSessionRecord>();
	private nextId = 1;

	async findByRefreshTokenHash(
		tokenHash: string,
	): Promise<AuthSessionRecord | null> {
		return (
			[...this.sessions.values()].find(
				(session) => session.refreshTokenHash === tokenHash,
			) ?? null
		);
	}

	async create(session: {
		userId: string;
		refreshTokenHash: string;
		expiresAt: Date;
	}): Promise<AuthSessionRecord> {
		const createdSession: AuthSessionRecord = {
			id: `session-${this.nextId++}`,
			userId: session.userId,
			refreshTokenHash: session.refreshTokenHash,
			expiresAt: session.expiresAt,
			revokedAt: null,
			lastUsedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.sessions.set(createdSession.id, createdSession);

		return createdSession;
	}

	async save(session: AuthSessionRecord): Promise<void> {
		this.sessions.set(session.id, session);
	}
}
