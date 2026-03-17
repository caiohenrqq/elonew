import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	AuthSessionRecord,
	AuthSessionRepositoryPort,
} from '@modules/auth/application/ports/auth-session-repository.port';
import { Injectable } from '@nestjs/common';

type AuthSessionDelegate = {
	findUnique(args: {
		where: { refreshTokenHash: string };
	}): Promise<AuthSessionRecord | null>;
	create(args: {
		data: {
			userId: string;
			refreshTokenHash: string;
			expiresAt: Date;
		};
	}): Promise<AuthSessionRecord>;
	update(args: {
		where: { id: string };
		data: {
			refreshTokenHash: string;
			expiresAt: Date;
			revokedAt: Date | null;
			lastUsedAt: Date | null;
		};
	}): Promise<AuthSessionRecord>;
};

type AuthSessionPrismaClient = {
	authSession: AuthSessionDelegate;
};

@Injectable()
export class PrismaAuthSessionRepository implements AuthSessionRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async findByRefreshTokenHash(
		tokenHash: string,
	): Promise<AuthSessionRecord | null> {
		return await this.getDelegate().findUnique({
			where: { refreshTokenHash: tokenHash },
		});
	}

	async create(session: {
		userId: string;
		refreshTokenHash: string;
		expiresAt: Date;
	}): Promise<AuthSessionRecord> {
		return await this.getDelegate().create({
			data: session,
		});
	}

	async save(session: AuthSessionRecord): Promise<void> {
		await this.getDelegate().update({
			where: { id: session.id },
			data: {
				refreshTokenHash: session.refreshTokenHash,
				expiresAt: session.expiresAt,
				revokedAt: session.revokedAt,
				lastUsedAt: session.lastUsedAt,
			},
		});
	}

	private getDelegate(): AuthSessionDelegate {
		return (this.prisma as unknown as AuthSessionPrismaClient).authSession;
	}
}
