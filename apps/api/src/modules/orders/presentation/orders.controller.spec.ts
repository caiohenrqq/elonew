import { AcceptOrderUseCase } from '@modules/orders/application/use-cases/accept-order/accept-order.use-case';
import { CancelOrderUseCase } from '@modules/orders/application/use-cases/cancel-order/cancel-order.use-case';
import { CompleteOrderUseCase } from '@modules/orders/application/use-cases/complete-order/complete-order.use-case';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from '@modules/orders/application/use-cases/get-order/get-order.use-case';
import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import { RejectOrderUseCase } from '@modules/orders/application/use-cases/reject-order/reject-order.use-case';
import { SaveOrderCredentialsUseCase } from '@modules/orders/application/use-cases/save-order-credentials/save-order-credentials.use-case';
import {
	OrderCredentialsPasswordMismatchError,
	OrderCredentialsStorageNotAllowedError,
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import {
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { OrdersController } from '@modules/orders/presentation/orders.controller';

type MutationUseCase = {
	execute: jest.Mock<Promise<void>, [unknown]>;
};

type GetOrderUseCaseMock = {
	execute: jest.Mock<Promise<{ id: string; status: string } | null>, [unknown]>;
};

function makeMutationUseCase(): MutationUseCase {
	return {
		execute: jest.fn().mockResolvedValue(undefined),
	};
}

function makeController() {
	const createOrderUseCase = {
		execute: jest.fn(),
	} as unknown as CreateOrderUseCase;
	const getOrderUseCase: GetOrderUseCaseMock = {
		execute: jest.fn().mockResolvedValue(null),
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
		rejectOrderUseCase,
		completeOrderUseCase,
		saveOrderCredentialsUseCase,
	};
}

describe('OrdersController', () => {
	it('maps reject not-found errors to NotFoundException', async () => {
		const { controller, rejectOrderUseCase } = makeController();
		rejectOrderUseCase.execute.mockRejectedValue(new OrderNotFoundError());

		await expect(controller.reject('order-1')).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});

	it('maps reject invalid-transition errors to BadRequestException', async () => {
		const { controller, rejectOrderUseCase } = makeController();
		rejectOrderUseCase.execute.mockRejectedValue(
			new OrderInvalidTransitionError('pending_booster', 'in_progress'),
		);

		await expect(controller.reject('order-2')).rejects.toBeInstanceOf(
			BadRequestException,
		);
	});

	it('maps complete not-found errors to NotFoundException', async () => {
		const { controller, completeOrderUseCase } = makeController();
		completeOrderUseCase.execute.mockRejectedValue(new OrderNotFoundError());

		await expect(controller.complete('order-3')).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});

	it('maps complete invalid-transition errors to BadRequestException', async () => {
		const { controller, completeOrderUseCase } = makeController();
		completeOrderUseCase.execute.mockRejectedValue(
			new OrderInvalidTransitionError('pending_booster', 'completed'),
		);

		await expect(controller.complete('order-4')).rejects.toBeInstanceOf(
			BadRequestException,
		);
	});

	it('maps credentials password mismatch errors to BadRequestException', async () => {
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
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it('maps credentials storage-not-allowed errors to BadRequestException', async () => {
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
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it('maps credentials order-not-found errors to NotFoundException', async () => {
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
		).rejects.toBeInstanceOf(NotFoundException);
	});
});
