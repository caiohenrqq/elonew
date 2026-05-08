import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderStatusPort } from '@modules/payments/application/ports/order-status.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { ResumePaymentCheckoutUseCase } from '@modules/payments/application/use-cases/resume-payment-checkout/resume-payment-checkout.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentCheckoutResumeNotAllowedError,
	PaymentNotFoundError,
} from '@modules/payments/domain/payment.errors';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<
		string,
		{ payment: Payment; clientId: string }
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
		for (const record of this.payments.values()) {
			if (record.payment.orderId === orderId) return record.payment;
		}

		return null;
	}

	async findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<Payment | null> {
		for (const record of this.payments.values()) {
			if (record.payment.orderId === orderId && record.clientId === clientId)
				return record.payment;
		}

		return null;
	}

	async findByGatewayId(): Promise<Payment | null> {
		throw new Error('not needed in this test');
	}

	async save(payment: Payment): Promise<void> {
		this.payments.set(payment.id, { payment, clientId: 'client-1' });
	}

	insert(payment: Payment, clientId: string): void {
		this.payments.set(payment.id, { payment, clientId });
	}
}

class InMemoryOrderStatusPort implements OrderStatusPort {
	private readonly statuses = new Map<
		string,
		{ status: OrderStatus; clientId: string }
	>();

	async findByOrderId(orderId: string): Promise<OrderStatus | null> {
		return this.statuses.get(orderId)?.status ?? null;
	}

	async findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<OrderStatus | null> {
		const record = this.statuses.get(orderId);
		if (!record || record.clientId !== clientId) return null;

		return record.status;
	}

	insert(orderId: string, status: OrderStatus, clientId = 'client-1'): void {
		this.statuses.set(orderId, { status, clientId });
	}
}

const makePayment = (input?: { checkoutUrl?: string | null }) => {
	const payment = Payment.create({
		id: 'payment-1',
		orderId: 'order-1',
		grossAmount: 100,
		paymentMethod: 'pix',
	});
	payment.attachGatewayDetails({
		gatewayReferenceId: 'pref-payment-1',
		gatewayId: null,
		gatewayStatus: 'pending',
		gatewayStatusDetail: null,
		checkoutUrl:
			input && 'checkoutUrl' in input
				? input.checkoutUrl
				: 'https://checkout.example/pay',
	});

	return payment;
};

describe('ResumePaymentCheckoutUseCase', () => {
	it('returns the stored checkout URL for an owned awaiting payment', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		repository.insert(makePayment(), 'client-1');
		orderStatusPort.insert('order-1', OrderStatus.AWAITING_PAYMENT);
		const useCase = new ResumePaymentCheckoutUseCase(
			repository,
			orderStatusPort,
		);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).resolves.toEqual({
			paymentId: 'payment-1',
			checkoutUrl: 'https://checkout.example/pay',
		});
	});

	it('throws when the payment belongs to another client', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		repository.insert(makePayment(), 'client-2');
		orderStatusPort.insert('order-1', OrderStatus.AWAITING_PAYMENT);
		const useCase = new ResumePaymentCheckoutUseCase(
			repository,
			orderStatusPort,
		);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).rejects.toThrow(PaymentNotFoundError);
	});

	it('throws when the payment has already left checkout', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const payment = makePayment();
		payment.confirm();
		repository.insert(payment, 'client-1');
		orderStatusPort.insert('order-1', OrderStatus.AWAITING_PAYMENT);
		const useCase = new ResumePaymentCheckoutUseCase(
			repository,
			orderStatusPort,
		);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).rejects.toThrow(PaymentCheckoutResumeNotAllowedError);
	});

	it('throws when an older payment has no stored checkout URL', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		repository.insert(makePayment({ checkoutUrl: null }), 'client-1');
		orderStatusPort.insert('order-1', OrderStatus.AWAITING_PAYMENT);
		const useCase = new ResumePaymentCheckoutUseCase(
			repository,
			orderStatusPort,
		);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).rejects.toThrow(PaymentCheckoutResumeNotAllowedError);
	});

	it.each([
		OrderStatus.CANCELLED,
		OrderStatus.PENDING_BOOSTER,
		OrderStatus.IN_PROGRESS,
		OrderStatus.COMPLETED,
	])('throws when the order is %s', async (status) => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		repository.insert(makePayment(), 'client-1');
		orderStatusPort.insert('order-1', status);
		const useCase = new ResumePaymentCheckoutUseCase(
			repository,
			orderStatusPort,
		);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).rejects.toThrow(PaymentCheckoutResumeNotAllowedError);
	});
});
