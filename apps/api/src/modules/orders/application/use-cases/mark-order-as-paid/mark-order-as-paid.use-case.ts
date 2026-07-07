import {
	type CouponLifecycleLogEvent,
	CouponLifecycleLogger,
	markCouponLifecycleLogError,
} from '@modules/orders/application/logging/coupon-lifecycle.logger';
import { createOrderEvent } from '@modules/orders/application/order-event.factory';
import {
	COUPON_EVENT_RECORDER_KEY,
	type CouponEventRecorderPort,
} from '@modules/orders/application/ports/coupon-event-recorder.port';
import {
	COUPON_LOOKUP_PORT_KEY,
	type CouponLookupPort,
} from '@modules/orders/application/ports/coupon-lookup.port';
import {
	ORDER_EVENT_PUBLISHER_KEY,
	type OrderEventPublisherPort,
} from '@modules/orders/application/ports/order-event-publisher.port';
import {
	ORDER_REPOSITORY_KEY,
	type OrderRepositoryPort,
} from '@modules/orders/application/ports/order-repository.port';
import { OrderLifecycleEmailService } from '@modules/orders/application/services/order-lifecycle-email.service';
import type { Order } from '@modules/orders/domain/order.entity';
import { OrderNotFoundError } from '@modules/orders/domain/order.errors';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { Inject, Injectable, Optional } from '@nestjs/common';

type MarkOrderAsPaidInput = {
	orderId: string;
};

@Injectable()
export class MarkOrderAsPaidUseCase {
	constructor(
		@Inject(ORDER_REPOSITORY_KEY)
		private readonly orderRepository: OrderRepositoryPort,
		@Inject(COUPON_LOOKUP_PORT_KEY)
		private readonly couponLookup: CouponLookupPort,
		@Inject(COUPON_EVENT_RECORDER_KEY)
		private readonly couponEvents: CouponEventRecorderPort,
		private readonly couponLifecycleLogger: CouponLifecycleLogger,
		@Optional()
		@Inject(ORDER_EVENT_PUBLISHER_KEY)
		private readonly orderEventPublisher?: OrderEventPublisherPort,
		@Optional()
		private readonly orderLifecycleEmails?: OrderLifecycleEmailService,
	) {}

	async execute(input: MarkOrderAsPaidInput): Promise<void> {
		const order = await this.orderRepository.findById(input.orderId);
		if (!order) throw new OrderNotFoundError();
		if (order.status !== OrderStatus.AWAITING_PAYMENT) return;

		order.confirmPayment();
		await this.orderRepository.save(order);
		await this.recordCouponUsage(order);
		await this.orderEventPublisher?.publish(
			createOrderEvent('order.paid', order),
		);
		await this.orderLifecycleEmails?.sendOrderPaidEmail(order);
	}

	private async recordCouponUsage(order: Order): Promise<void> {
		const couponId = order.couponId;
		if (!couponId) return;

		const startedAt = Date.now();
		const event: CouponLifecycleLogEvent = {
			event: 'coupon.lifecycle',
			operation: 'payment_confirmed_usage',
			coupon_id: couponId,
			client_id: order.clientId ?? undefined,
			order_id: order.id,
			discount_amount: order.discountAmount,
			side_effects: [],
		};

		try {
			const coupon = await this.couponLookup.findById(couponId);
			if (!coupon) {
				event.outcome = 'skipped';
				return;
			}
			event.coupon_code = coupon.code;
			await this.couponEvents.record({
				type: 'confirmed_by_payment',
				code: coupon.code,
				couponId,
				clientId: order.clientId,
				orderId: order.id,
			});
			event.side_effects?.push('coupon_usage_recorded');
			event.outcome = 'success';
		} catch (error) {
			markCouponLifecycleLogError(event, error);
			throw error;
		} finally {
			this.couponLifecycleLogger.emit(event, startedAt);
		}
	}
}
