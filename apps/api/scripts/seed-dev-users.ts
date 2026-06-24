import { validateDatabaseEnv } from '@packages/config/env/database-env.config';
import {
	DEV_USER_PASSWORD,
	DEV_USERS,
	type DevUserRole,
} from '@packages/shared/testing/dev-users';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prismaRoleByDevUserRole: Record<DevUserRole, Role> = {
	ADMIN: Role.ADMIN,
	BOOSTER: Role.BOOSTER,
	CLIENT: Role.CLIENT,
};

const getDatabaseUrl = () => validateDatabaseEnv(process.env).DATABASE_URL;

const prisma = new PrismaClient({
	adapter: new PrismaPg({
		connectionString: getDatabaseUrl(),
	}),
});

const main = async () => {
	const passwordHash = await argon2.hash(DEV_USER_PASSWORD);
	const confirmedAt = new Date();

	for (const user of DEV_USERS) {
		const data = {
			username: user.username,
			password: passwordHash,
			role: prismaRoleByDevUserRole[user.role],
			isActive: true,
			emailConfirmedAt: confirmedAt,
		};
		const seededUser = await prisma.user.upsert({
			where: { email: user.email },
			create: {
				email: user.email,
				...data,
			},
			update: data,
		});
		if (user.role === 'BOOSTER') {
			await prisma.wallet.upsert({
				where: { boosterId: seededUser.id },
				create: { boosterId: seededUser.id },
				update: {},
			});
		}
	}

	console.log('Seeded dev accounts:');
	for (const user of DEV_USERS) {
		console.log(`- ${user.role.toLowerCase()}: ${user.email}`);
	}
	console.log(`Password: ${DEV_USER_PASSWORD}`);
};

main()
	.finally(async () => {
		await prisma.$disconnect();
	})
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	});
