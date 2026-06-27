import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	CouponLookupPort,
	StoredCoupon,
} from '@modules/orders/application/ports/coupon-lookup.port';
import { mapStoredCoupon } from '@modules/orders/infrastructure/repositories/coupon.mapper';
import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

const CONFIRMED_ORDER_STATUSES: OrderStatus[] = [
	OrderStatus.pending_booster,
	OrderStatus.in_progress,
	OrderStatus.completed,
];

@Injectable()
export class PrismaCouponLookupRepository implements CouponLookupPort {
	constructor(private readonly prisma: PrismaService) {}

	async findByCode(code: string): Promise<StoredCoupon | null> {
		const coupon = await this.prisma.coupon.findUnique({ where: { code } });
		return coupon ? mapStoredCoupon(coupon) : null;
	}

	async findById(id: string): Promise<StoredCoupon | null> {
		const coupon = await this.prisma.coupon.findUnique({ where: { id } });
		return coupon ? mapStoredCoupon(coupon) : null;
	}

	async countConfirmedUsage(couponId: string): Promise<number> {
		return this.prisma.order.count({
			where: { couponId, status: { in: CONFIRMED_ORDER_STATUSES } },
		});
	}

	async countConfirmedUsageForClient(
		couponId: string,
		clientId: string,
	): Promise<number> {
		return this.prisma.order.count({
			where: { couponId, clientId, status: { in: CONFIRMED_ORDER_STATUSES } },
		});
	}
}
