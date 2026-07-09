import type { OrderCredentialCleanupPort } from '@modules/payments/application/ports/order-credential-cleanup.port';
import type { OrderPaymentConfirmationPort } from '@modules/payments/application/ports/order-payment-confirmation.port';
import { SimulateDevPaymentOutcomeUseCase } from '@modules/payments/application/use-cases/simulate-dev-payment-outcome/simulate-dev-payment-outcome.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import { InMemoryPaymentRepository } from '../../../../../../test/support/in-memory/payments/in-memory-payment.repository';

const makePayment = () =>
	Payment.create({
		id: 'payment-1',
		orderId: 'order-1',
		grossAmount: 100,
		paymentMethod: 'pix',
	});

describe('SimulateDevPaymentOutcomeUseCase', () => {
	it('confirms the owned payment when simulating approval', async () => {
		const payments = new InMemoryPaymentRepository();
		const confirmation: OrderPaymentConfirmationPort = {
			markAsPaid: jest.fn(),
		};
		const cleanup: OrderCredentialCleanupPort = {
			clearCredentials: jest.fn(),
		};
		payments.insert(makePayment(), 'client-1');
		const useCase = new SimulateDevPaymentOutcomeUseCase(
			payments,
			confirmation,
			cleanup,
		);

		await expect(
			useCase.execute({
				paymentId: 'payment-1',
				clientId: 'client-1',
				outcome: 'approved',
			}),
		).resolves.toMatchObject({
			id: 'payment-1',
			status: 'held',
			gatewayStatus: 'approved',
			gatewayStatusDetail: 'accredited',
		});
		expect(confirmation.markAsPaid).toHaveBeenCalledWith('order-1');
		expect(cleanup.clearCredentials).not.toHaveBeenCalled();
	});

	it('fails the owned payment when simulating rejection', async () => {
		const payments = new InMemoryPaymentRepository();
		const confirmation: OrderPaymentConfirmationPort = {
			markAsPaid: jest.fn(),
		};
		const cleanup: OrderCredentialCleanupPort = {
			clearCredentials: jest.fn(),
		};
		payments.insert(makePayment(), 'client-1');
		const useCase = new SimulateDevPaymentOutcomeUseCase(
			payments,
			confirmation,
			cleanup,
		);

		await expect(
			useCase.execute({
				paymentId: 'payment-1',
				clientId: 'client-1',
				outcome: 'rejected',
			}),
		).resolves.toMatchObject({
			id: 'payment-1',
			status: 'failed',
			gatewayStatus: 'rejected',
			gatewayStatusDetail: 'cc_rejected_other_reason',
		});
		expect(cleanup.clearCredentials).toHaveBeenCalledWith('order-1');
		expect(confirmation.markAsPaid).not.toHaveBeenCalled();
	});

	it('keeps pending outcomes awaiting confirmation', async () => {
		const payments = new InMemoryPaymentRepository();
		const confirmation: OrderPaymentConfirmationPort = {
			markAsPaid: jest.fn(),
		};
		const cleanup: OrderCredentialCleanupPort = {
			clearCredentials: jest.fn(),
		};
		payments.insert(makePayment(), 'client-1');
		const useCase = new SimulateDevPaymentOutcomeUseCase(
			payments,
			confirmation,
			cleanup,
		);

		await expect(
			useCase.execute({
				paymentId: 'payment-1',
				clientId: 'client-1',
				outcome: 'in_process',
			}),
		).resolves.toMatchObject({
			id: 'payment-1',
			status: 'awaiting_confirmation',
			gatewayStatus: 'in_process',
			gatewayStatusDetail: 'pending_contingency',
		});
		expect(confirmation.markAsPaid).not.toHaveBeenCalled();
		expect(cleanup.clearCredentials).not.toHaveBeenCalled();
	});

	it('does not allow another client to simulate a payment', async () => {
		const payments = new InMemoryPaymentRepository();
		payments.insert(makePayment(), 'client-1');
		const useCase = new SimulateDevPaymentOutcomeUseCase(
			payments,
			{ markAsPaid: jest.fn() },
			{ clearCredentials: jest.fn() },
		);

		await expect(
			useCase.execute({
				paymentId: 'payment-1',
				clientId: 'client-2',
				outcome: 'approved',
			}),
		).rejects.toThrow('Payment not found.');
	});
});
