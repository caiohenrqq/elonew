import { OrderStatus } from '@modules/orders/domain/order-status';
import { Payment } from '@modules/payments/domain/payment.entity';

describe('Payment', () => {
	it('starts awaiting confirmation & computes 70% booster amount', () => {
		const payment = Payment.create({
			id: 'payment-1',
			orderId: 'order-1',
			grossAmount: 100,
		});

		expect(payment.status).toBe('awaiting_confirmation');
		expect(payment.boosterAmount).toBe(70);
	});

	it('holds funds when payment gets confirmed', () => {
		const payment = Payment.create({
			id: 'payment-2',
			orderId: 'order-2',
			grossAmount: 85,
		});

		payment.confirm();
		expect(payment.status).toBe('held');
	});

	it('treats repeated confirmation as idempotent', () => {
		const payment = Payment.create({
			id: 'payment-4',
			orderId: 'order-4',
			grossAmount: 120,
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
		});
		payment.confirm();

		expect(() => payment.releaseHold(OrderStatus.IN_PROGRESS)).toThrow(
			'Payment hold can only be released after order completion.',
		);

		payment.releaseHold(OrderStatus.COMPLETED);
		expect(payment.status).toBe('released');
	});

	it('treats repeated release as idempotent', () => {
		const payment = Payment.create({
			id: 'payment-5',
			orderId: 'order-5',
			grossAmount: 100,
		});
		payment.confirm();
		payment.releaseHold(OrderStatus.COMPLETED);

		expect(() => payment.releaseHold(OrderStatus.COMPLETED)).not.toThrow();
		expect(payment.status).toBe('released');
	});
});
