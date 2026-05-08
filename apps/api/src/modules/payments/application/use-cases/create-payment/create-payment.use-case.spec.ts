import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderPaymentAmountPort } from '@modules/payments/application/ports/order-payment-amount.port';
import type { OrderStatusPort } from '@modules/payments/application/ports/order-status.port';
import type { PaymentGatewayPort } from '@modules/payments/application/ports/payment-gateway.port';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment/create-payment.use-case';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentAlreadyExistsError,
	PaymentOrderNotFoundError,
} from '@modules/payments/domain/payment.errors';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
	private readonly payments = new Map<string, Payment>();

	async findById(id: string): Promise<Payment | null> {
		return this.payments.get(id) ?? null;
	}

	async findByIdForClient(): Promise<Payment | null> {
		throw new Error('not needed in this test');
	}

	async findByOrderId(orderId: string): Promise<Payment | null> {
		for (const payment of this.payments.values()) {
			if (payment.orderId === orderId) return payment;
		}

		return null;
	}

	async findByOrderIdForClient(): Promise<Payment | null> {
		throw new Error('not needed in this test');
	}

	async findByGatewayId(): Promise<Payment | null> {
		throw new Error('not needed in this test');
	}

	async save(payment: Payment): Promise<void> {
		this.payments.set(payment.id, payment);
	}

	insert(payment: Payment): void {
		this.payments.set(payment.id, payment);
	}
}

class InMemoryOrderStatusPort implements OrderStatusPort {
	private readonly orderStatuses = new Map<
		string,
		{ clientId: string; status: OrderStatus }
	>();

	set(orderId: string, clientId: string, status: OrderStatus): void {
		this.orderStatuses.set(orderId, { clientId, status });
	}

	async findByOrderId(orderId: string): Promise<OrderStatus | null> {
		return this.orderStatuses.get(orderId)?.status ?? null;
	}

	async findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<OrderStatus | null> {
		const order = this.orderStatuses.get(orderId);
		if (!order || order.clientId !== clientId) return null;

		return order.status;
	}
}

class InMemoryOrderPaymentAmountPort implements OrderPaymentAmountPort {
	private readonly orderAmounts = new Map<
		string,
		{ clientId: string; totalAmount: number }
	>();

	set(orderId: string, clientId: string, totalAmount: number): void {
		this.orderAmounts.set(orderId, { clientId, totalAmount });
	}

	async findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<number | null> {
		const order = this.orderAmounts.get(orderId);
		if (!order || order.clientId !== clientId) return null;

		return order.totalAmount;
	}
}

class InMemoryPaymentGatewayPort implements PaymentGatewayPort {
	lastInput:
		| {
				paymentId: string;
				orderId: string;
				amount: number;
				paymentMethod: 'pix' | 'credit_card' | 'boleto';
		  }
		| undefined;

	async initiatePayment(input: {
		paymentId: string;
		orderId: string;
		amount: number;
		paymentMethod: 'pix' | 'credit_card' | 'boleto';
	}): Promise<{
		checkoutUrl: string;
		gatewayReferenceId: string;
		gatewayStatus: string | null;
	}> {
		this.lastInput = input;

		return {
			checkoutUrl: `https://mercadopago.test/checkout/${input.paymentId}`,
			gatewayReferenceId: `pref-${input.paymentId}`,
			gatewayStatus: 'pending',
		};
	}

	async fetchPaymentNotification(): Promise<{
		internalPaymentId: string;
		gatewayPaymentId: string;
		gatewayStatus: string;
		gatewayStatusDetail: string | null;
		isApproved: boolean;
	}> {
		throw new Error('not needed in this test');
	}
}

describe('CreatePaymentUseCase', () => {
	it('creates a payment from the owned order total amount and returns the checkout url', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const orderPaymentAmountPort = new InMemoryOrderPaymentAmountPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		orderStatusPort.set('order-1', 'client-1', OrderStatus.AWAITING_PAYMENT);
		orderPaymentAmountPort.set('order-1', 'client-1', 100);
		const useCase = new CreatePaymentUseCase(
			repository,
			orderStatusPort,
			orderPaymentAmountPort,
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				paymentMethod: 'pix',
				orderId: 'order-1',
			}),
		).resolves.toMatchObject({
			orderId: 'order-1',
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
			paymentMethod: 'pix',
			checkoutUrl: expect.stringContaining('/checkout/'),
		});

		expect(paymentGatewayPort.lastInput).toMatchObject({
			orderId: 'order-1',
			amount: 100,
			paymentMethod: 'pix',
		});
	});

	it('rejects payment creation for another client order', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const orderPaymentAmountPort = new InMemoryOrderPaymentAmountPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		orderStatusPort.set('order-1', 'client-2', OrderStatus.AWAITING_PAYMENT);
		orderPaymentAmountPort.set('order-1', 'client-2', 100);
		const useCase = new CreatePaymentUseCase(
			repository,
			orderStatusPort,
			orderPaymentAmountPort,
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				paymentMethod: 'pix',
				orderId: 'order-1',
			}),
		).rejects.toThrow(PaymentOrderNotFoundError);
	});

	it('generates the payment id on the server', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const orderPaymentAmountPort = new InMemoryOrderPaymentAmountPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		orderStatusPort.set(
			'order-generated-id',
			'client-1',
			OrderStatus.AWAITING_PAYMENT,
		);
		orderPaymentAmountPort.set('order-generated-id', 'client-1', 100);
		const useCase = new CreatePaymentUseCase(
			repository,
			orderStatusPort,
			orderPaymentAmountPort,
			paymentGatewayPort,
		);

		const payment = await useCase.execute({
			clientId: 'client-1',
			paymentMethod: 'pix',
			orderId: 'order-generated-id',
		});

		expect(payment.id).toEqual(expect.any(String));
		expect(payment.id).not.toHaveLength(0);
	});

	it('rejects creating a second payment for the same order', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const orderPaymentAmountPort = new InMemoryOrderPaymentAmountPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		orderStatusPort.set(
			'order-duplicate',
			'client-1',
			OrderStatus.AWAITING_PAYMENT,
		);
		orderPaymentAmountPort.set('order-duplicate', 'client-1', 100);
		repository.insert(
			Payment.create({
				id: 'payment-existing',
				orderId: 'order-duplicate',
				grossAmount: 100,
				paymentMethod: 'pix',
			}),
		);
		const useCase = new CreatePaymentUseCase(
			repository,
			orderStatusPort,
			orderPaymentAmountPort,
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				paymentMethod: 'pix',
				orderId: 'order-duplicate',
			}),
		).rejects.toThrow(PaymentAlreadyExistsError);
	});

	it('throws when related order does not exist', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const orderPaymentAmountPort = new InMemoryOrderPaymentAmountPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		const useCase = new CreatePaymentUseCase(
			repository,
			orderStatusPort,
			orderPaymentAmountPort,
			paymentGatewayPort,
		);

		await expect(
			useCase.execute({
				clientId: 'client-1',
				paymentMethod: 'pix',
				orderId: 'missing-order',
			}),
		).rejects.toThrow(PaymentOrderNotFoundError);
	});

	it('persists Mercado Pago reference details on the created payment', async () => {
		const repository = new InMemoryPaymentRepository();
		const orderStatusPort = new InMemoryOrderStatusPort();
		const orderPaymentAmountPort = new InMemoryOrderPaymentAmountPort();
		const paymentGatewayPort = new InMemoryPaymentGatewayPort();
		orderStatusPort.set(
			'order-reference',
			'client-1',
			OrderStatus.AWAITING_PAYMENT,
		);
		orderPaymentAmountPort.set('order-reference', 'client-1', 100);
		const useCase = new CreatePaymentUseCase(
			repository,
			orderStatusPort,
			orderPaymentAmountPort,
			paymentGatewayPort,
		);

		const createdPayment = await useCase.execute({
			clientId: 'client-1',
			paymentMethod: 'pix',
			orderId: 'order-reference',
		});

		const savedPayment = await repository.findById(createdPayment.id);
		expect(savedPayment?.gatewayReferenceId).toBe(`pref-${createdPayment.id}`);
		expect(savedPayment?.gatewayStatus).toBe('pending');
		expect(savedPayment?.gatewayId).toBeNull();
		expect(savedPayment?.checkoutUrl).toBe(
			`https://mercadopago.test/checkout/${createdPayment.id}`,
		);
	});
});
