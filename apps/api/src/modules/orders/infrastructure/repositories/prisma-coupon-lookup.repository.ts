import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	CouponLookupPort,
	StoredCoupon,
} from '@modules/orders/application/ports/coupon-lookup.port';
import { Injectable } from '@nestjs/common';
import { CouponDiscountType } from '@prisma/client';

type CouponRecord = {
	id: string;
	code: string;
	discountType: CouponDiscountType;
	discount: number;
	isActive: boolean;
	firstOrderOnly: boolean;
};

@Injectable()
export class PrismaCouponLookupRepository implements CouponLookupPort {
	constructor(private readonly prisma: PrismaService) {}

	async findByCode(code: string): Promise<StoredCoupon | null> {
		const coupon = await this.prisma.coupon.findUnique({
			where: { code },
		});
		if (!coupon) return null;

		return this.mapCoupon(coupon);
	}

	async findById(id: string): Promise<StoredCoupon | null> {
		const coupon = await this.prisma.coupon.findUnique({
			where: { id },
		});
		if (!coupon) return null;

		return this.mapCoupon(coupon);
	}

	private mapCoupon(record: CouponRecord): StoredCoupon {
		return {
			id: record.id,
			code: record.code,
			discountType:
				record.discountType === CouponDiscountType.PERCENTAGE
					? 'percentage'
					: 'fixed',
			discount: record.discount,
			isActive: record.isActive,
			firstOrderOnly: record.firstOrderOnly,
		};
	}
}
