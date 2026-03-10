import { PrismaService } from '@app/common/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { OrdersModule } from '@modules/orders/orders.module';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';
import type { CreateOrderSchemaInput } from '@shared/orders/create-order.schema';

describe('Orders module integration (db)', () => {
	let moduleRef: TestingModule;
	let controller: OrdersController;
	let prisma: PrismaService;
	let clientUser: AuthenticatedUser;

	function makeCreateOrderBody(): CreateOrderSchemaInput {
		return {
			serviceType: 'elo_boost',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: '2026-03-31T00:00:00.000Z',
		};
	}

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [OrdersModule],
		}).compile();

		controller = moduleRef.get(OrdersController);
		prisma = moduleRef.get(PrismaService);
		await prisma.payment.deleteMany();
		await prisma.order.deleteMany();
		const uniqueSuffix = Date.now().toString();
		const createdUser = await prisma.user.create({
			data: {
				username: `client-${uniqueSuffix}`,
				email: `client-${uniqueSuffix}@example.com`,
				password: 'secret',
				role: 'CLIENT',
			},
		});
		clientUser = {
			id: createdUser.id,
			role: Role.CLIENT,
		};
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('creates and fetches an order', async () => {
		const createdOrder = await controller.create(
			makeCreateOrderBody(),
			clientUser,
		);

		expect(createdOrder).toMatchObject({
			id: expect.any(String),
			status: 'awaiting_payment',
		});
		const persistedOrder = await prisma.order.findUnique({
			where: { id: createdOrder.id },
		});
		expect(persistedOrder).toMatchObject({
			id: createdOrder.id,
			clientId: clientUser.id,
			serviceType: 'ELO_BOOST',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
		});

		await expect(controller.get(createdOrder.id)).resolves.toEqual({
			id: createdOrder.id,
			status: 'awaiting_payment',
		});
	});

	it('applies payment confirmation and acceptance transitions', async () => {
		const createdOrder = await controller.create(
			makeCreateOrderBody(),
			clientUser,
		);
		await expect(controller.confirmPayment(createdOrder.id)).resolves.toEqual({
			success: true,
		});
		await expect(controller.accept(createdOrder.id)).resolves.toEqual({
			success: true,
		});

		await expect(controller.get(createdOrder.id)).resolves.toEqual({
			id: createdOrder.id,
			status: 'in_progress',
		});
	});

	it('maps missing order to not found exception', async () => {
		await expect(controller.get('missing-order')).rejects.toBeInstanceOf(
			NotFoundException,
		);
		await expect(
			controller.confirmPayment('missing-order'),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it('maps invalid transitions to bad request exception', async () => {
		const createdOrder = await controller.create(
			makeCreateOrderBody(),
			clientUser,
		);

		await expect(controller.accept(createdOrder.id)).rejects.toBeInstanceOf(
			BadRequestException,
		);
	});

	it('persists credentials after payment confirmation', async () => {
		const createdOrder = await controller.create(
			makeCreateOrderBody(),
			clientUser,
		);
		await controller.confirmPayment(createdOrder.id);
		await expect(
			controller.saveCredentials(createdOrder.id, {
				login: 'login-db',
				summonerName: 'summoner-db',
				password: 'secret-db',
				confirmPassword: 'secret-db',
			}),
		).resolves.toEqual({ success: true });

		const credentials = await prisma.orderCredentials.findUnique({
			where: { orderId: createdOrder.id },
		});
		expect(credentials).toMatchObject({
			orderId: createdOrder.id,
			login: 'login-db',
			summonerName: 'summoner-db',
			password: 'secret-db',
		});
	});

	it('deletes credentials after order completion', async () => {
		const createdOrder = await controller.create(
			makeCreateOrderBody(),
			clientUser,
		);
		await controller.confirmPayment(createdOrder.id);
		await controller.saveCredentials(createdOrder.id, {
			login: 'login-db',
			summonerName: 'summoner-db',
			password: 'secret-db',
			confirmPassword: 'secret-db',
		});
		await controller.accept(createdOrder.id);
		await controller.complete(createdOrder.id);

		const credentials = await prisma.orderCredentials.findUnique({
			where: { orderId: createdOrder.id },
		});
		expect(credentials).toBeNull();
		await expect(controller.get(createdOrder.id)).resolves.toEqual({
			id: createdOrder.id,
			status: 'completed',
		});
	});

	it('rejects credentials before payment confirmation', async () => {
		const createdOrder = await controller.create(
			makeCreateOrderBody(),
			clientUser,
		);

		await expect(
			controller.saveCredentials(createdOrder.id, {
				login: 'login-db',
				summonerName: 'summoner-db',
				password: 'secret-db',
				confirmPassword: 'secret-db',
			}),
		).rejects.toBeInstanceOf(BadRequestException);
	});
});
