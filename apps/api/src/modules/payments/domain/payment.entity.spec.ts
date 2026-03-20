import { OrderStatus } from '@modules/orders/domain/order-status';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentAmountInvalidError,
	PaymentHoldReleaseNotAllowedError,
	PaymentInvalidTransitionError,
} from '@modules/payments/domain/payment.errors';

describe('Payment', () => {
	it('starts awaiting confirmation & computes 70% booster amount', () => {
		const payment = Payment.create({
			id: 'payment-1',
			orderId: 'order-1',
			grossAmount: 100,
			paymentMethod: 'pix',
		});

		expect(payment.status).toBe('awaiting_confirmation');
		expect(payment.boosterAmount).toBe(70);
		expect(payment.paymentMethod).toBe('pix');
	});

	it('rejects non-positive payment amount', () => {
		expect(() =>
			Payment.create({
				id: 'payment-invalid',
				orderId: 'order-invalid',
				grossAmount: 0,
				paymentMethod: 'pix',
			}),
		).toThrow(PaymentAmountInvalidError);
	});

	it('rejects non-finite payment amount values', () => {
		expect(() =>
			Payment.create({
				id: 'payment-invalid-nan',
				orderId: 'order-invalid-nan',
				grossAmount: Number.NaN,
				paymentMethod: 'pix',
			}),
		).toThrow(PaymentAmountInvalidError);
	});

	it('holds funds when payment gets confirmed', () => {
		const payment = Payment.create({
			id: 'payment-2',
			orderId: 'order-2',
			grossAmount: 85,
			paymentMethod: 'pix',
		});

		payment.confirm();
		expect(payment.status).toBe('held');
	});

	it('treats repeated confirmation as idempotent', () => {
		const payment = Payment.create({
			id: 'payment-4',
			orderId: 'order-4',
			grossAmount: 120,
			paymentMethod: 'pix',
		});

		payment.confirm();
		expect(() => payment.confirm()).not.toThrow();
		expect(payment.status).toBe('held');
	});

	it('releases hold only when order is completed', () => {
		const payment = Payment.create({
			id: 'payment-3',
			orderId: 'order-3',
			grossAmount: 100,
			paymentMethod: 'pix',
		});
		payment.confirm();

		expect(() => payment.releaseHold(OrderStatus.IN_PROGRESS)).toThrow(
			PaymentHoldReleaseNotAllowedError,
		);

		payment.releaseHold(OrderStatus.COMPLETED);
		expect(payment.status).toBe('released');
	});

	it('treats repeated release as idempotent', () => {
		const payment = Payment.create({
			id: 'payment-5',
			orderId: 'order-5',
			grossAmount: 100,
			paymentMethod: 'pix',
		});
		payment.confirm();
		payment.releaseHold(OrderStatus.COMPLETED);

		expect(() => payment.releaseHold(OrderStatus.COMPLETED)).not.toThrow();
		expect(payment.status).toBe('released');
	});

	it('fails a payment before confirmation', () => {
		const payment = Payment.create({
			id: 'payment-6',
			orderId: 'order-6',
			grossAmount: 100,
			paymentMethod: 'pix',
		});

		payment.fail();

		expect(payment.status).toBe('failed');
	});

	it('treats repeated failure as idempotent', () => {
		const payment = Payment.create({
			id: 'payment-7',
			orderId: 'order-7',
			grossAmount: 100,
			paymentMethod: 'pix',
		});

		payment.fail();

		expect(() => payment.fail()).not.toThrow();
		expect(payment.status).toBe('failed');
	});

	it('blocks failing a released payment', () => {
		const payment = Payment.create({
			id: 'payment-8',
			orderId: 'order-8',
			grossAmount: 100,
			paymentMethod: 'pix',
		});
		payment.confirm();
		payment.releaseHold(OrderStatus.COMPLETED);

		expect(() => payment.fail()).toThrow(PaymentInvalidTransitionError);
	});
});
