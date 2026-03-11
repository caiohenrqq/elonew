import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	BoosterUser,
	BoosterUserReaderPort,
} from '@modules/orders/application/ports/booster-user-reader.port';
import { Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type UserRecord = {
	id: string;
	role: string;
};

type UserDelegate = {
	findUnique(args: {
		where: { id: string };
		select: { id: true; role: true };
	}): Promise<UserRecord | null>;
};

type UserPrismaClient = {
	user: UserDelegate;
};

@Injectable()
export class PrismaBoosterUserReader implements BoosterUserReaderPort {
	constructor(private readonly prisma: PrismaService) {}

	async findById(id: string): Promise<BoosterUser | null> {
		const record = await this.getDelegate().findUnique({
			where: { id },
			select: { id: true, role: true },
		});
		if (!record) return null;

		return {
			id: record.id,
			role: this.mapRole(record.role),
		};
	}

	private getDelegate(): UserDelegate {
		return (this.prisma as unknown as UserPrismaClient).user;
	}

	private mapRole(role: string): Role {
		switch (role) {
			case 'CLIENT':
				return Role.CLIENT;
			case 'BOOSTER':
				return Role.BOOSTER;
			case 'ADMIN':
				return Role.ADMIN;
			default:
				throw new Error(`Invalid user role persisted: ${role}`);
		}
	}
}
