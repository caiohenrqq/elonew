import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderStatusPort } from '@modules/payments/application/ports/order-status.port';
import type {
	InitiatePaymentInput,
	InitiatePaymentOutput,
	PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
import { ResumePaymentCheckoutUseCase } from '@modules/payments/application/use-cases/resume-payment-checkout/resume-payment-checkout.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentCheckoutResumeNotAllowedError,
	PaymentNotFoundError,
} from '@modules/payments/domain/payment.errors';
import { InMemoryPaymentRepository } from '../../../../../../test/support/in-memory/payments/in-memory-payment.repository';

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

class FakePaymentGateway implements PaymentGatewayPort {
	lastInput: InitiatePaymentInput | undefined;

	async initiatePayment(
		input: InitiatePaymentInput,
	): Promise<InitiatePaymentOutput> {
		this.lastInput = input;

		return {
			checkoutUrl: `https://checkout.example/fresh/${input.paymentId}`,
			backUrl: `https://app.example/client/orders/${input.orderId}`,
			gatewayReferenceId: `pref-fresh-${input.paymentId}`,
			gatewayStatus: 'pending',
		};
	}

	async fetchPaymentNotification(): Promise<never> {
		throw new Error('not needed in this test');
	}

	async fetchPaymentByExternalReference(): Promise<never> {
		throw new Error('not needed in this test');
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
	it('creates a fresh checkout for an owned awaiting payment', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		repository.insert(makePayment(), 'client-1');
		orderStatusPort.insert('order-1', OrderStatus.AWAITING_PAYMENT);
		const useCase = new ResumePaymentCheckoutUseCase(
			repository,
			orderStatusPort,
			new FakePaymentGateway(),
		);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).resolves.toEqual({
			paymentId: 'payment-1',
			checkoutUrl: 'https://checkout.example/fresh/payment-1',
		});

		const saved = await repository.findById('payment-1');
		expect(saved?.gatewayReferenceId).toBe('pref-fresh-payment-1');
		expect(saved?.checkoutUrl).toBe('https://checkout.example/fresh/payment-1');
	});

	it('throws when the payment belongs to another client', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		repository.insert(makePayment(), 'client-2');
		orderStatusPort.insert('order-1', OrderStatus.AWAITING_PAYMENT);
		const useCase = new ResumePaymentCheckoutUseCase(
			repository,
			orderStatusPort,
			new FakePaymentGateway(),
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
			new FakePaymentGateway(),
		);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).rejects.toThrow(PaymentCheckoutResumeNotAllowedError);
	});

	it('recovers an older payment that has no stored checkout URL', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		repository.insert(makePayment({ checkoutUrl: null }), 'client-1');
		orderStatusPort.insert('order-1', OrderStatus.AWAITING_PAYMENT);
		const useCase = new ResumePaymentCheckoutUseCase(
			repository,
			orderStatusPort,
			new FakePaymentGateway(),
		);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).resolves.toEqual({
			paymentId: 'payment-1',
			checkoutUrl: 'https://checkout.example/fresh/payment-1',
		});
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
			new FakePaymentGateway(),
		);

		await expect(
			useCase.execute({ orderId: 'order-1', clientId: 'client-1' }),
		).rejects.toThrow(PaymentCheckoutResumeNotAllowedError);
	});
});
