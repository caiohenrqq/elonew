import { PrismaService } from '@app/common/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import {
	OrderNotRatableError,
	RatingAlreadySubmittedError,
} from '@modules/ratings/domain/rating.errors';
import { RatingsController } from '@modules/ratings/presentation/ratings.controller';
import { RatingsModule } from '@modules/ratings/ratings.module';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';

describe('Ratings module integration (db)', () => {
	let moduleRef: TestingModule;
	let controller: RatingsController;
	let prisma: PrismaService;
	let clientUser: AuthenticatedUser;
	let boosterUser: AuthenticatedUser;

	const createUser = async (
		username: string,
		role: 'CLIENT' | 'BOOSTER',
	): Promise<string> => {
		const user = await prisma.user.create({
			data: {
				username,
				email: `${username}@example.com`,
				password: 'secret',
				role,
				profile: { create: {} },
			},
		});
		return user.id;
	};

	const createCompletedOrder = async (completedAt = new Date()) =>
		prisma.order.create({
			data: {
				clientId: clientUser.id,
				boosterId: boosterUser.id,
				status: 'completed',
				completedAt,
			},
		});

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [RatingsModule],
		}).compile();

		controller = moduleRef.get(RatingsController);
		prisma = moduleRef.get(PrismaService);

		await prisma.rating.deleteMany();
		await prisma.ticketMessage.deleteMany();
		await prisma.ticket.deleteMany();
		await prisma.chatMessage.deleteMany();
		await prisma.chat.deleteMany();
		await prisma.walletTransaction.deleteMany();
		await prisma.payment.deleteMany();
		await prisma.orderCredentials.deleteMany();
		await prisma.orderQuote.deleteMany();
		await prisma.order.deleteMany();
		await prisma.profile.deleteMany();
		await prisma.authSession.deleteMany();
		await prisma.wallet.deleteMany();
		await prisma.user.deleteMany();

		clientUser = {
			id: await createUser('rating-client', 'CLIENT'),
			role: Role.CLIENT,
		};
		boosterUser = {
			id: await createUser('rating-booster', 'BOOSTER'),
			role: Role.BOOSTER,
		};
	});

	afterEach(async () => {
		await prisma.rating.deleteMany();
		await moduleRef.close();
	});

	it('persists both rating directions and recomputes reputation in the same transaction', async () => {
		const order = await createCompletedOrder();

		await controller.submit({ orderId: order.id, score: 4 }, clientUser);
		await controller.submit({ orderId: order.id, score: 5 }, boosterUser);

		const ratings = await prisma.rating.findMany({
			where: { orderId: order.id },
			orderBy: { createdAt: 'asc' },
		});
		expect(ratings).toHaveLength(2);
		expect(ratings.map((r) => r.toUserId).sort()).toEqual(
			[boosterUser.id, clientUser.id].sort(),
		);

		const boosterProfile = await prisma.profile.findUnique({
			where: { userId: boosterUser.id },
		});
		expect(boosterProfile?.reputation).toBe(4);
	});

	it('averages reputation across multiple received ratings', async () => {
		const orderOne = await createCompletedOrder();
		const orderTwo = await createCompletedOrder();
		const secondClient = await createUser('rating-client-2', 'CLIENT');
		await prisma.order.update({
			where: { id: orderTwo.id },
			data: { clientId: secondClient },
		});

		await controller.submit({ orderId: orderOne.id, score: 5 }, clientUser);
		await controller.submit(
			{ orderId: orderTwo.id, score: 3 },
			{ id: secondClient, role: Role.CLIENT },
		);

		const boosterProfile = await prisma.profile.findUnique({
			where: { userId: boosterUser.id },
		});
		expect(boosterProfile?.reputation).toBe(4);
	});

	it('blocks a second rating in the same direction', async () => {
		const order = await createCompletedOrder();
		await controller.submit({ orderId: order.id, score: 5 }, clientUser);

		await expect(
			controller.submit({ orderId: order.id, score: 1 }, clientUser),
		).rejects.toThrow(RatingAlreadySubmittedError);

		const ratings = await prisma.rating.findMany({
			where: { orderId: order.id },
		});
		expect(ratings).toHaveLength(1);
		expect(ratings[0]?.score).toBe(5);
	});

	it('rejects rating an order that is not completed', async () => {
		const order = await prisma.order.create({
			data: {
				clientId: clientUser.id,
				boosterId: boosterUser.id,
				status: 'in_progress',
			},
		});

		await expect(
			controller.submit({ orderId: order.id, score: 5 }, clientUser),
		).rejects.toThrow(OrderNotRatableError);
	});

	it('returns both ratings for a participant', async () => {
		const order = await createCompletedOrder();
		await controller.submit({ orderId: order.id, score: 4 }, clientUser);
		await controller.submit({ orderId: order.id, score: 5 }, boosterUser);

		const ratings = await controller.listForOrder(order.id, clientUser);
		expect(ratings).toHaveLength(2);
	});
});
