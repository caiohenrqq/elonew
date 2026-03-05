import { Order } from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';

describe('Order domain rules', () => {
	it('starts in awaiting payment status', () => {
		const order = Order.create('order-1');

		expect(order.status).toBe(OrderStatus.AWAITING_PAYMENT);
	});

	it('moves to pending booster after payment confirmation', () => {
		const order = Order.create('order-1');

		order.confirmPayment();

		expect(order.status).toBe(OrderStatus.PENDING_BOOSTER);
	});

	it('allows cancellation before booster acceptance', () => {
		const order = Order.create('order-1');

		order.confirmPayment();
		order.cancel();

		expect(order.status).toBe(OrderStatus.CANCELLED);
	});

	it('blocks cancellation after booster acceptance', () => {
		const order = Order.create('order-1');

		order.confirmPayment();
		order.acceptByBooster();

		expect(() => order.cancel()).toThrow(
			'Order cannot be cancelled after booster acceptance.',
		);
	});

	it('blocks invalid transition when booster accepts before payment confirmation', () => {
		const order = Order.create('order-1');

		expect(() => order.acceptByBooster()).toThrow(
			'Invalid order transition: awaiting_payment -> in_progress.',
		);
	});
});
