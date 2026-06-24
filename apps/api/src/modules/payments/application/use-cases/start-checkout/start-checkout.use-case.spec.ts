import type {
	CheckoutPaymentPayload,
	OrderCheckoutPort,
} from '@modules/orders/application/ports/order-checkout.port';
import { OrderStatus } from '@modules/orders/domain/order-status';
import type {
	InitiatePaymentInput,
	InitiatePaymentOutput,
	PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
import { StartCheckoutUseCase } from '@modules/payments/application/use-cases/start-checkout/start-checkout.use-case';
import { PaymentOrderNotFoundError } from '@modules/payments/domain/payment.errors';
import { PaymentStatus } from '@modules/payments/domain/payment-status';

class FakeOrderCheckout implements OrderCheckoutPort {
	quoteAmount: number | null = 12000;
	persistedPayment: CheckoutPaymentPayload | undefined;
	createCalls = 0;

	async createDraftOrderFromOwnedQuote(input: {
		orderId: string;
		payment?: CheckoutPaymentPayload;
	}) {
		this.createCalls += 1;
		this.persistedPayment = input.payment;
		return { id: input.orderId, status: OrderStatus.AWAITING_PAYMENT } as never;
	}

	async findOwnedQuoteTotalAmount(): Promise<number | null> {
		return this.quoteAmount;
	}
}

class FakeGateway implements PaymentGatewayPort {
	initiateCalls = 0;
	shouldFail = false;

	async initiatePayment(
		_input: InitiatePaymentInput,
	): Promise<InitiatePaymentOutput> {
		this.initiateCalls += 1;
		if (this.shouldFail) throw new Error('gateway down');

		return {
			checkoutUrl: 'https://checkout.example/pay',
			gatewayReferenceId: 'pref-1',
			gatewayStatus: 'pending',
		};
	}

	async fetchPaymentNotification(): Promise<never> {
		throw new Error('not needed in this test');
	}
}

const run = (orderCheckout: FakeOrderCheckout, gateway: FakeGateway) =>
	new StartCheckoutUseCase(orderCheckout, gateway).execute({
		clientId: 'client-1',
		quoteId: 'quote-1',
		paymentMethod: 'pix',
		now: new Date('2026-05-01T00:00:00.000Z'),
	});

describe('StartCheckoutUseCase', () => {
	it('initiates the gateway then persists the order and payment together', async () => {
		const orderCheckout = new FakeOrderCheckout();
		const gateway = new FakeGateway();

		const result = await run(orderCheckout, gateway);

		expect(gateway.initiateCalls).toBe(1);
		expect(orderCheckout.createCalls).toBe(1);
		expect(result).toMatchObject({
			checkoutUrl: 'https://checkout.example/pay',
			paymentMethod: 'pix',
			grossAmount: 12000,
			status: PaymentStatus.AWAITING_CONFIRMATION,
		});
		expect(orderCheckout.persistedPayment).toMatchObject({
			id: result.paymentId,
			checkoutUrl: 'https://checkout.example/pay',
			gatewayReferenceId: 'pref-1',
			grossAmount: 12000,
		});
	});

	it('does not persist an order when payment initiation fails', async () => {
		const orderCheckout = new FakeOrderCheckout();
		const gateway = new FakeGateway();
		gateway.shouldFail = true;

		await expect(run(orderCheckout, gateway)).rejects.toThrow('gateway down');
		expect(orderCheckout.createCalls).toBe(0);
	});

	it('fails before calling the gateway when the quote is missing', async () => {
		const orderCheckout = new FakeOrderCheckout();
		orderCheckout.quoteAmount = null;
		const gateway = new FakeGateway();

		await expect(run(orderCheckout, gateway)).rejects.toBeInstanceOf(
			PaymentOrderNotFoundError,
		);
		expect(gateway.initiateCalls).toBe(0);
		expect(orderCheckout.createCalls).toBe(0);
	});
});
