import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment/create-payment.use-case';
import { FailPaymentUseCase } from '@modules/payments/application/use-cases/fail-payment/fail-payment.use-case';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold/release-payment-hold.use-case';
import {
	PaymentInvalidTransitionError,
	PaymentNotFoundError,
} from '@modules/payments/domain/payment.errors';
import { PaymentsController } from '@modules/payments/presentation/payments.controller';

type MutationUseCase = {
	execute: jest.Mock<Promise<void>, [unknown]>;
};

type GetPaymentUseCaseMock = {
	execute: jest.Mock<
		Promise<{
			id: string;
			orderId: string;
			status: string;
			grossAmount: number;
			boosterAmount: number;
		}>,
		[unknown]
	>;
};

function makeMutationUseCase(): MutationUseCase {
	return {
		execute: jest.fn().mockResolvedValue(undefined),
	};
}

function makeController() {
	const createPaymentUseCase = {
		execute: jest.fn(),
	} as unknown as CreatePaymentUseCase;
	const getPaymentUseCase: GetPaymentUseCaseMock = {
		execute: jest.fn(),
	};
	const confirmPaymentUseCase = makeMutationUseCase();
	const failPaymentUseCase = makeMutationUseCase();
	const handlePaymentConfirmedWebhookUseCase = {
		execute: jest.fn(),
	} as unknown as HandlePaymentConfirmedWebhookUseCase;
	const releasePaymentHoldUseCase = makeMutationUseCase();

	return {
		controller: new PaymentsController(
			createPaymentUseCase,
			getPaymentUseCase as unknown as GetPaymentUseCase,
			confirmPaymentUseCase as unknown as ConfirmPaymentUseCase,
			failPaymentUseCase as unknown as FailPaymentUseCase,
			handlePaymentConfirmedWebhookUseCase,
			releasePaymentHoldUseCase as unknown as ReleasePaymentHoldUseCase,
		),
		getPaymentUseCase,
		confirmPaymentUseCase,
	};
}

describe('PaymentsController', () => {
	it('returns payment details from the use-case', async () => {
		const { controller, getPaymentUseCase } = makeController();
		getPaymentUseCase.execute.mockResolvedValue({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'pending',
			grossAmount: 100,
			boosterAmount: 70,
		});

		await expect(controller.get('payment-1')).resolves.toEqual({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'pending',
			grossAmount: 100,
			boosterAmount: 70,
		});
	});

	it('propagates get not-found errors without local HTTP mapping', async () => {
		const { controller, getPaymentUseCase } = makeController();
		getPaymentUseCase.execute.mockRejectedValue(new PaymentNotFoundError());

		await expect(controller.get('payment-1')).rejects.toBeInstanceOf(
			PaymentNotFoundError,
		);
	});

	it('propagates confirm invalid-transition errors without local HTTP mapping', async () => {
		const { controller, confirmPaymentUseCase } = makeController();
		confirmPaymentUseCase.execute.mockRejectedValue(
			new PaymentInvalidTransitionError('held', 'held'),
		);

		await expect(controller.confirm('payment-2')).rejects.toBeInstanceOf(
			PaymentInvalidTransitionError,
		);
	});
});
