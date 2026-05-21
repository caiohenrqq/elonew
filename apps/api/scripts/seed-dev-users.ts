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
	const existingDevUsers = await prisma.user.findMany({
		where: {
			email: {
				in: DEV_USERS.map((user) => user.email),
			},
		},
		select: {
			email: true,
		},
	});
	if (existingDevUsers.length > 0) {
		console.warn('Dev seed skipped. These accounts already exist:');
		for (const user of existingDevUsers) {
			console.warn(`- ${user.email}`);
		}
		console.warn(
			'Delete those users first if you need to recreate dev accounts.',
		);
		return;
	}

	const passwordHash = await argon2.hash(DEV_USER_PASSWORD);
	const confirmedAt = new Date();

	for (const user of DEV_USERS) {
		await prisma.user.create({
			data: {
				email: user.email,
				username: user.username,
				password: passwordHash,
				role: prismaRoleByDevUserRole[user.role],
				isActive: true,
				emailConfirmedAt: confirmedAt,
			},
		});
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
