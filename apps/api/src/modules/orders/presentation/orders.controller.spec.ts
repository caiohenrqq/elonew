import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { CompleteOrderUseCase } from '@modules/orders/application/use-cases/complete-order/complete-order.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import {
	OrderAlreadyExistsError,
	OrderCredentialsPasswordMismatchError,
	OrderCredentialsStorageNotAllowedError,
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import { OrdersController } from '@modules/orders/presentation/orders.controller';
import { Role } from '@packages/auth/roles/role';

type MutationUseCase = {
	execute: jest.Mock<Promise<void>, [unknown]>;
};

type GetOrderUseCaseMock = {
	execute: jest.Mock<Promise<{ id: string; status: string }>, [unknown]>;
};

function makeMutationUseCase(): MutationUseCase {
	return {
		execute: jest.fn().mockResolvedValue(undefined),
	};
}

function makeController() {
	const createOrderExecute = jest.fn();
	const createOrderUseCase = {
		execute: createOrderExecute,
	} as unknown as CreateOrderUseCase;
	const getOrderUseCase: GetOrderUseCaseMock = {
		execute: jest.fn().mockResolvedValue({
			id: 'order-1',
			status: 'awaiting_payment',
		}),
	};
	const markOrderAsPaidUseCase = makeMutationUseCase();
	const acceptOrderUseCase = makeMutationUseCase();
	const rejectOrderUseCase = makeMutationUseCase();
	const cancelOrderUseCase = makeMutationUseCase();
	const completeOrderUseCase = makeMutationUseCase();
	const saveOrderCredentialsUseCase = makeMutationUseCase();

	return {
		controller: new OrdersController(
			createOrderUseCase,
			getOrderUseCase as unknown as GetOrderUseCase,
			markOrderAsPaidUseCase as unknown as MarkOrderAsPaidUseCase,
			acceptOrderUseCase as unknown as AcceptOrderUseCase,
			rejectOrderUseCase as unknown as RejectOrderUseCase,
			cancelOrderUseCase as unknown as CancelOrderUseCase,
			completeOrderUseCase as unknown as CompleteOrderUseCase,
			saveOrderCredentialsUseCase as unknown as SaveOrderCredentialsUseCase,
		),
		createOrderExecute,
		getOrderUseCase,
		rejectOrderUseCase,
		completeOrderUseCase,
		saveOrderCredentialsUseCase,
	};
}

describe('OrdersController', () => {
	const clientUser: AuthenticatedUser = {
		id: 'client-1',
		role: Role.CLIENT,
	};

	it('maps authenticated create-order requests into the use-case input', async () => {
		const { controller, createOrderExecute } = makeController();
		createOrderExecute.mockResolvedValue({
			id: 'order-1',
			status: 'awaiting_payment',
		});

		await expect(
			controller.create(
				{
					boosterId: 'booster-1',
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
				},
				clientUser,
			),
		).resolves.toEqual({
			id: 'order-1',
			status: 'awaiting_payment',
		});
		expect(createOrderExecute).toHaveBeenCalledWith({
			clientId: 'client-1',
			boosterId: 'booster-1',
			serviceType: 'elo_boost',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: new Date('2026-03-31T00:00:00.000Z'),
		});
	});

	it('propagates domain errors from reject without local HTTP mapping', async () => {
		const { controller, rejectOrderUseCase } = makeController();
		rejectOrderUseCase.execute.mockRejectedValue(new OrderNotFoundError());

		await expect(controller.reject('order-1')).rejects.toBeInstanceOf(
			OrderNotFoundError,
		);
	});

	it('propagates domain errors from create without local HTTP mapping', async () => {
		const { controller, createOrderExecute } = makeController();
		createOrderExecute.mockRejectedValue(new OrderAlreadyExistsError());

		await expect(
			controller.create(
				{
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
				},
				clientUser,
			),
		).rejects.toBeInstanceOf(OrderAlreadyExistsError);
	});

	it('propagates domain errors from reject without local HTTP mapping', async () => {
		const { controller, rejectOrderUseCase } = makeController();
		rejectOrderUseCase.execute.mockRejectedValue(
			new OrderInvalidTransitionError('pending_booster', 'in_progress'),
		);

		await expect(controller.reject('order-2')).rejects.toBeInstanceOf(
			OrderInvalidTransitionError,
		);
	});

	it('propagates domain errors from complete without local HTTP mapping', async () => {
		const { controller, completeOrderUseCase } = makeController();
		completeOrderUseCase.execute.mockRejectedValue(new OrderNotFoundError());

		await expect(controller.complete('order-3')).rejects.toBeInstanceOf(
			OrderNotFoundError,
		);
	});

	it('propagates domain errors from complete without local HTTP mapping', async () => {
		const { controller, completeOrderUseCase } = makeController();
		completeOrderUseCase.execute.mockRejectedValue(
			new OrderInvalidTransitionError('pending_booster', 'completed'),
		);

		await expect(controller.complete('order-4')).rejects.toBeInstanceOf(
			OrderInvalidTransitionError,
		);
	});

	it('propagates credentials password mismatch errors without local HTTP mapping', async () => {
		const { controller, saveOrderCredentialsUseCase } = makeController();
		saveOrderCredentialsUseCase.execute.mockRejectedValue(
			new OrderCredentialsPasswordMismatchError(),
		);

		await expect(
			controller.saveCredentials('order-5', {
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'different',
			}),
		).rejects.toBeInstanceOf(OrderCredentialsPasswordMismatchError);
	});

	it('propagates credentials storage-not-allowed errors without local HTTP mapping', async () => {
		const { controller, saveOrderCredentialsUseCase } = makeController();
		saveOrderCredentialsUseCase.execute.mockRejectedValue(
			new OrderCredentialsStorageNotAllowedError(),
		);

		await expect(
			controller.saveCredentials('order-6', {
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			}),
		).rejects.toBeInstanceOf(OrderCredentialsStorageNotAllowedError);
	});

	it('propagates credentials order-not-found errors without local HTTP mapping', async () => {
		const { controller, saveOrderCredentialsUseCase } = makeController();
		saveOrderCredentialsUseCase.execute.mockRejectedValue(
			new OrderNotFoundError(),
		);

		await expect(
			controller.saveCredentials('order-7', {
				login: 'login',
				summonerName: 'summoner',
				password: 'secret',
				confirmPassword: 'secret',
			}),
		).rejects.toBeInstanceOf(OrderNotFoundError);
	});

	it('propagates get not-found errors without local HTTP mapping', async () => {
		const { controller, getOrderUseCase } = makeController();
		getOrderUseCase.execute.mockRejectedValue(new OrderNotFoundError());

		await expect(controller.get('order-8')).rejects.toBeInstanceOf(
			OrderNotFoundError,
		);
	});
});
