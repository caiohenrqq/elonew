import {
	COUPON_ADMIN_REPOSITORY_KEY,
	type CouponAdminRepositoryPort,
	type CouponSummary,
} from '@modules/orders/application/ports/coupon-admin-repository.port';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ListCouponsUseCase {
	constructor(
		@Inject(COUPON_ADMIN_REPOSITORY_KEY)
		private readonly repository: CouponAdminRepositoryPort,
	) {}

	async execute(): Promise<CouponSummary[]> {
		return this.repository.list();
	}
}
