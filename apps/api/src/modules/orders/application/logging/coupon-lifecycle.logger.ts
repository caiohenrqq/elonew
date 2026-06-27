import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

export type CouponLifecycleLogEvent = {
	event: 'coupon.lifecycle';
	operation: 'create' | 'disable' | 'payment_confirmed_usage';
	outcome?: 'success' | 'error' | 'skipped';
	duration_ms?: number;
	admin_user_id?: string;
	client_id?: string;
	coupon_id?: string;
	coupon_code?: string;
	order_id?: string;
	discount_amount?: number;
	first_order_only?: boolean;
	side_effects?: string[];
	error_type?: string;
	error_message?: string;
};

export function markCouponLifecycleLogError(
	event: CouponLifecycleLogEvent,
	error: unknown,
): void {
	event.outcome = 'error';
	event.error_type =
		error instanceof Error ? error.constructor.name : typeof error;
	event.error_message =
		error instanceof Error ? error.message : 'Unknown error';
}

@Injectable()
export class CouponLifecycleLogger {
	constructor(private readonly logger: PinoLogger) {
		this.logger.setContext(CouponLifecycleLogger.name);
	}

	emit(event: CouponLifecycleLogEvent, startedAt: number): void {
		event.duration_ms = Date.now() - startedAt;

		if (event.outcome === 'error') this.logger.error(event);
		else this.logger.info(event);
	}
}
