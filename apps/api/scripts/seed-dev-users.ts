import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const DEV_PASSWORD = 'DevPassword123!';

const devUsers = [
	{
		email: 'admin@elojob.com',
		username: 'dev-admin',
		role: Role.ADMIN,
	},
	{
		email: 'booster@elojob.com',
		username: 'dev-booster',
		role: Role.BOOSTER,
	},
	{
		email: 'client@elojob.com',
		username: 'dev-client',
		role: Role.CLIENT,
	},
];

const getDatabaseUrl = () => {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) throw new Error('DATABASE_URL is required.');
	return databaseUrl;
};

const prisma = new PrismaClient({
	adapter: new PrismaPg({
		connectionString: getDatabaseUrl(),
	}),
});

const main = async () => {
	const existingDevUsers = await prisma.user.findMany({
		where: {
			email: {
				in: devUsers.map((user) => user.email),
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

	const passwordHash = await argon2.hash(DEV_PASSWORD);
	const confirmedAt = new Date();

	for (const user of devUsers) {
		await prisma.user.create({
			data: {
				email: user.email,
				username: user.username,
				password: passwordHash,
				role: user.role,
				isActive: true,
				emailConfirmedAt: confirmedAt,
			},
		});
	}

	console.log('Seeded dev accounts:');
	for (const user of devUsers) {
		console.log(`- ${user.role.toLowerCase()}: ${user.email}`);
	}
	console.log(`Password: ${DEV_PASSWORD}`);
};

main()
	.finally(async () => {
		await prisma.$disconnect();
	})
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	});
