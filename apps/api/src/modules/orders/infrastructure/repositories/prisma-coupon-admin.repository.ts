import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	CouponAdminRepositoryPort,
	CouponPersistenceInput,
	CouponReport,
	CouponSummary,
} from '@modules/orders/application/ports/coupon-admin-repository.port';
import { mapStoredCoupon } from '@modules/orders/infrastructure/repositories/coupon.mapper';
import { mapServiceTypeToPersistence } from '@modules/orders/infrastructure/repositories/service-type.mapper';
import { Injectable } from '@nestjs/common';
import {
	type CouponEventType,
	couponEventTypes,
} from '@packages/shared/coupons/coupon';
import { CouponDiscountType, OrderStatus } from '@prisma/client';

const CONFIRMED_ORDER_STATUSES: OrderStatus[] = [
	OrderStatus.pending_booster,
	OrderStatus.in_progress,
	OrderStatus.completed,
];

@Injectable()
export class PrismaCouponAdminRepository implements CouponAdminRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async existsByCode(code: string): Promise<boolean> {
		const coupon = await this.prisma.coupon.findUnique({
			where: { code },
			select: { id: true },
		});
		return coupon !== null;
	}

	async create(
		input: CouponPersistenceInput,
		adminUserId: string,
	): Promise<{ id: string; code: string }> {
		return this.prisma.$transaction(async (tx) => {
			const coupon = await tx.coupon.create({
				data: {
					code: input.code,
					discountType:
						input.discountType === 'percentage'
							? CouponDiscountType.PERCENTAGE
							: CouponDiscountType.FIXED,
					discount: input.discount,
					firstOrderOnly: input.firstOrderOnly,
					allowedServiceTypes: input.allowedServiceTypes.map(
						mapServiceTypeToPersistence,
					),
					allowedQueues: input.allowedQueues,
					allowedEmails: input.allowedEmails,
					minSubtotal: input.minSubtotal,
					maxSubtotal: input.maxSubtotal,
					minRankIndex: input.minRankIndex,
					maxRankIndex: input.maxRankIndex,
					minExtrasCount: input.minExtrasCount,
					requiredExtra: input.requiredExtra,
					globalUsageLimit: input.globalUsageLimit,
					perUserUsageLimit: input.perUserUsageLimit,
				},
				select: { id: true, code: true },
			});
			await tx.couponEvent.create({
				data: {
					type: 'created',
					code: coupon.code,
					couponId: coupon.id,
					reason: adminUserId,
				},
			});
			return coupon;
		});
	}

	async list(): Promise<CouponSummary[]> {
		const coupons = await this.prisma.coupon.findMany({
			orderBy: { createdAt: 'desc' },
		});
		const usage = await this.prisma.order.groupBy({
			by: ['couponId'],
			where: {
				couponId: { not: null },
				status: { in: CONFIRMED_ORDER_STATUSES },
			},
			_count: { _all: true },
		});
		const usageByCoupon = new Map(
			usage.map((row) => [row.couponId, row._count._all]),
		);

		return coupons.map((coupon) => ({
			...mapStoredCoupon(coupon),
			createdAt: coupon.createdAt,
			usageCount: usageByCoupon.get(coupon.id) ?? 0,
		}));
	}

	async findById(id: string): Promise<CouponSummary | null> {
		const coupon = await this.prisma.coupon.findUnique({ where: { id } });
		if (!coupon) return null;
		const usageCount = await this.prisma.order.count({
			where: { couponId: id, status: { in: CONFIRMED_ORDER_STATUSES } },
		});
		return {
			...mapStoredCoupon(coupon),
			createdAt: coupon.createdAt,
			usageCount,
		};
	}

	async disable(id: string, adminUserId: string): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const result = await tx.coupon.updateMany({
				where: { id, isActive: true },
				data: { isActive: false },
			});
			if (result.count === 0) return false;

			const coupon = await tx.coupon.findUnique({
				where: { id },
				select: { code: true },
			});
			await tx.couponEvent.create({
				data: {
					type: 'disabled',
					code: coupon?.code ?? id,
					couponId: id,
					reason: adminUserId,
				},
			});
			return true;
		});
	}

	async getReport(couponId: string): Promise<CouponReport | null> {
		const coupon = await this.prisma.coupon.findUnique({
			where: { id: couponId },
			select: { id: true, code: true },
		});
		if (!coupon) return null;

		const confirmed = await this.prisma.order.aggregate({
			where: { couponId, status: { in: CONFIRMED_ORDER_STATUSES } },
			_sum: { discountAmount: true, totalAmount: true },
			_count: { _all: true },
		});
		const distinctClients = await this.prisma.order.findMany({
			where: { couponId, status: { in: CONFIRMED_ORDER_STATUSES } },
			select: { clientId: true },
			distinct: ['clientId'],
		});
		const eventGroups = await this.prisma.couponEvent.groupBy({
			by: ['type'],
			where: { couponId },
			_count: { _all: true },
		});

		const eventCounts = Object.fromEntries(
			couponEventTypes.map((type) => [type, 0]),
		) as CouponReport['eventCounts'];
		for (const group of eventGroups)
			eventCounts[group.type as CouponEventType] = group._count._all;

		const usageCount = confirmed._count._all;
		const appliedCount = eventCounts.applied_at_checkout;

		return {
			couponId: coupon.id,
			code: coupon.code,
			usageCount,
			discountTotalCents: confirmed._sum.discountAmount ?? 0,
			revenueCents: confirmed._sum.totalAmount ?? 0,
			uniqueClients: distinctClients.length,
			appliedCount,
			conversionRate: appliedCount > 0 ? usageCount / appliedCount : 0,
			eventCounts,
		};
	}
}
