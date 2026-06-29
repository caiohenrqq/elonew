import {
	type CouponLifecycleLogEvent,
	CouponLifecycleLogger,
	markCouponLifecycleLogError,
} from '@modules/orders/application/logging/coupon-lifecycle.logger';
import {
	COUPON_ADMIN_REPOSITORY_KEY,
	type CouponAdminRepositoryPort,
} from '@modules/orders/application/ports/coupon-admin-repository.port';
import { CouponNotFoundError } from '@modules/orders/domain/order-pricing.errors';
import { Inject, Injectable } from '@nestjs/common';

type EnableCouponInput = {
	couponId: string;
	adminUserId: string;
};

@Injectable()
export class EnableCouponUseCase {
	constructor(
		@Inject(COUPON_ADMIN_REPOSITORY_KEY)
		private readonly repository: CouponAdminRepositoryPort,
		private readonly lifecycleLogger: CouponLifecycleLogger,
	) {}

	async execute(input: EnableCouponInput): Promise<void> {
		const startedAt = Date.now();
		const event: CouponLifecycleLogEvent = {
			event: 'coupon.lifecycle',
			operation: 'enable',
			admin_user_id: input.adminUserId,
			coupon_id: input.couponId,
			side_effects: [],
		};

		try {
			const coupon = await this.repository.findById(input.couponId);
			if (!coupon) throw new CouponNotFoundError();
			event.coupon_code = coupon.code;

			const enabled = await this.repository.enable(
				input.couponId,
				input.adminUserId,
			);
			if (enabled) event.side_effects?.push('coupon_enabled');
			event.outcome = enabled ? 'success' : 'skipped';
		} catch (error) {
			markCouponLifecycleLogError(event, error);
			throw error;
		} finally {
			this.lifecycleLogger.emit(event, startedAt);
		}
	}
}
