import {
	COUPON_ADMIN_REPOSITORY_KEY,
	type CouponAdminRepositoryPort,
	type CouponReport,
} from '@modules/orders/application/ports/coupon-admin-repository.port';
import { CouponNotFoundError } from '@modules/orders/domain/order-pricing.errors';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetCouponReportUseCase {
	constructor(
		@Inject(COUPON_ADMIN_REPOSITORY_KEY)
		private readonly repository: CouponAdminRepositoryPort,
	) {}

	async execute(input: { couponId: string }): Promise<CouponReport> {
		const report = await this.repository.getReport(input.couponId);
		if (!report) throw new CouponNotFoundError();
		return report;
	}
}
