import {
	type CouponLifecycleLogEvent,
	CouponLifecycleLogger,
	markCouponLifecycleLogError,
} from '@modules/orders/application/logging/coupon-lifecycle.logger';
import {
	COUPON_ADMIN_REPOSITORY_KEY,
	type CouponAdminRepositoryPort,
	type CouponPersistenceInput,
} from '@modules/orders/application/ports/coupon-admin-repository.port';
import { CouponCodeAlreadyExistsError } from '@modules/orders/domain/order-pricing.errors';
import { Inject, Injectable } from '@nestjs/common';
import {
	generateCouponCode,
	normalizeCouponCode,
} from '@packages/shared/coupons/coupon';
import type { CreateCouponInput } from '@packages/shared/coupons/create-coupon.schema';
import { findOrderRankIndex } from '@packages/shared/orders/order-rank-progression';

const MAX_CODE_GENERATION_ATTEMPTS = 10;

type CreateCouponUseCaseInput = CreateCouponInput & {
	adminUserId: string;
};

@Injectable()
export class CreateCouponUseCase {
	constructor(
		@Inject(COUPON_ADMIN_REPOSITORY_KEY)
		private readonly repository: CouponAdminRepositoryPort,
		private readonly lifecycleLogger: CouponLifecycleLogger,
	) {}

	async execute(
		input: CreateCouponUseCaseInput,
	): Promise<{ id: string; code: string }> {
		const startedAt = Date.now();
		const event: CouponLifecycleLogEvent = {
			event: 'coupon.lifecycle',
			operation: 'create',
			admin_user_id: input.adminUserId,
			first_order_only: input.firstOrderOnly,
			side_effects: [],
		};

		try {
			const code = await this.resolveCode(input.code);

			const persistenceInput: CouponPersistenceInput = {
				code,
				discountType: input.discountType,
				discount: input.discount,
				firstOrderOnly: input.firstOrderOnly,
				allowedServiceTypes: input.allowedServiceTypes,
				allowedQueues: input.allowedQueues,
				allowedEmails: input.allowedEmails,
				minSubtotal: input.minSubtotal ?? null,
				maxSubtotal: input.maxSubtotal ?? null,
				minRankIndex: input.minRank
					? findOrderRankIndex(input.minRank.league, input.minRank.division)
					: null,
				maxRankIndex: input.maxRank
					? findOrderRankIndex(input.maxRank.league, input.maxRank.division)
					: null,
				minExtrasCount: input.minExtrasCount ?? null,
				requiredExtra: input.requiredExtra ?? null,
				globalUsageLimit: input.globalUsageLimit ?? null,
				perUserUsageLimit: input.perUserUsageLimit ?? null,
			};

			const created = await this.repository.create(
				persistenceInput,
				input.adminUserId,
			);
			event.coupon_id = created.id;
			event.coupon_code = created.code;
			event.side_effects?.push('coupon_created');
			event.outcome = 'success';
			return created;
		} catch (error) {
			markCouponLifecycleLogError(event, error);
			throw error;
		} finally {
			this.lifecycleLogger.emit(event, startedAt);
		}
	}

	private async resolveCode(code: string | undefined): Promise<string> {
		if (code) {
			const normalized = normalizeCouponCode(code);
			if (await this.repository.existsByCode(normalized))
				throw new CouponCodeAlreadyExistsError();
			return normalized;
		}

		for (
			let attempt = 0;
			attempt < MAX_CODE_GENERATION_ATTEMPTS;
			attempt += 1
		) {
			const candidate = generateCouponCode();
			if (!(await this.repository.existsByCode(candidate))) return candidate;
		}
		throw new CouponCodeAlreadyExistsError();
	}
}
