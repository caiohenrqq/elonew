import type { OrderCredentialCleanupPort } from '@modules/payments/application/ports/order-credential-cleanup.port';
import type { OrderPaymentConfirmationPort } from '@modules/payments/application/ports/order-payment-confirmation.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { SimulateDevPaymentOutcomeUseCase } from '@modules/payments/application/use-cases/simulate-dev-payment-outcome/simulate-dev-payment-outcome.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';

class PaymentRepositoryStub implements PaymentRepositoryPort {
	private readonly payments = new Map<
		string,
		{ clientId: string; payment: Payment }
	>();

	async findById(id: string): Promise<Payment | null> {
		return this.payments.get(id)?.payment ?? null;
	}

	async findByIdForClient(
		id: string,
		clientId: string,
	): Promise<Payment | null> {
		const record = this.payments.get(id);
		if (!record || record.clientId !== clientId) return null;

		return record.payment;
	}

	async findByOrderId(orderId: string): Promise<Payment | null> {
		for (const { payment } of this.payments.values()) {
			if (payment.orderId === orderId) return payment;
		}

		return null;
	}

	async findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<Payment | null> {
		for (const { payment, clientId: ownerId } of this.payments.values()) {
			if (payment.orderId === orderId && ownerId === clientId) return payment;
		}

		return null;
	}

	async findByGatewayId(): Promise<Payment | null> {
		throw new Error('not needed in this test');
	}

	async save(payment: Payment): Promise<void> {
		const record = this.payments.get(payment.id);
		this.payments.set(payment.id, {
			clientId: record?.clientId ?? 'client-1',
			payment,
		});
	}

	insert(clientId: string, payment: Payment): void {
		this.payments.set(payment.id, { clientId, payment });
	}
}

const makePayment = () =>
	Payment.create({
		id: 'payment-1',
		orderId: 'order-1',
		grossAmount: 100,
		paymentMethod: 'pix',
	});

describe('SimulateDevPaymentOutcomeUseCase', () => {
	it('confirms the owned payment when simulating approval', async () => {
		const payments = new PaymentRepositoryStub();
		const confirmation: OrderPaymentConfirmationPort = {
			markAsPaid: jest.fn(),
		};
		const cleanup: OrderCredentialCleanupPort = {
			clearCredentials: jest.fn(),
		};
		payments.insert('client-1', makePayment());
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
		const payments = new PaymentRepositoryStub();
		const confirmation: OrderPaymentConfirmationPort = {
			markAsPaid: jest.fn(),
		};
		const cleanup: OrderCredentialCleanupPort = {
			clearCredentials: jest.fn(),
		};
		payments.insert('client-1', makePayment());
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
		const payments = new PaymentRepositoryStub();
		const confirmation: OrderPaymentConfirmationPort = {
			markAsPaid: jest.fn(),
		};
		const cleanup: OrderCredentialCleanupPort = {
			clearCredentials: jest.fn(),
		};
		payments.insert('client-1', makePayment());
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
		const payments = new PaymentRepositoryStub();
		payments.insert('client-1', makePayment());
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
