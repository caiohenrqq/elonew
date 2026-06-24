import { PrismaService } from '@app/common/prisma/prisma.service';
import { OrderStatus } from '@modules/orders/domain/order-status';
import {
	type RatableOrder,
	type RatingOrderLookupPort,
} from '@modules/ratings/application/ports/rating-order-lookup.port';
import {
	type RatingRecord,
	type RatingRepositoryPort,
} from '@modules/ratings/application/ports/rating-repository.port';
import type { Rating } from '@modules/ratings/domain/rating.entity';
import { RatingAlreadySubmittedError } from '@modules/ratings/domain/rating.errors';
import { Injectable } from '@nestjs/common';
import { ensurePersistedEnum } from '@packages/shared/utils/enum.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaRatingRepository
	implements RatingRepositoryPort, RatingOrderLookupPort
{
	constructor(private readonly prisma: PrismaService) {}

	async findById(orderId: string): Promise<RatableOrder | null> {
		const order = await this.prisma.order.findUnique({
			where: { id: orderId },
			select: {
				id: true,
				clientId: true,
				boosterId: true,
				status: true,
				completedAt: true,
			},
		});
		if (!order) return null;

		return {
			id: order.id,
			clientId: order.clientId,
			boosterId: order.boosterId,
			status: ensurePersistedEnum(OrderStatus, order.status, 'order status'),
			completedAt: order.completedAt,
		};
	}

	async findByOrderAndRater(
		orderId: string,
		fromUserId: string,
	): Promise<RatingRecord | null> {
		const rating = await this.prisma.rating.findUnique({
			where: { orderId_fromUserId: { orderId, fromUserId } },
		});

		return rating ? this.toRecord(rating) : null;
	}

	async listForOrder(orderId: string): Promise<RatingRecord[]> {
		const ratings = await this.prisma.rating.findMany({
			where: { orderId },
			orderBy: { createdAt: 'asc' },
		});

		return ratings.map((rating) => this.toRecord(rating));
	}

	async save(rating: Rating): Promise<RatingRecord> {
		try {
			return await this.prisma.$transaction(async (tx) => {
				const created = await tx.rating.create({
					data: {
						orderId: rating.orderId,
						fromUserId: rating.fromUserId,
						toUserId: rating.toUserId,
						score: rating.score,
						comment: rating.comment,
						createdAt: rating.createdAt,
					},
				});

				const aggregate = await tx.rating.aggregate({
					where: { toUserId: rating.toUserId },
					_avg: { score: true },
				});
				await tx.profile.updateMany({
					where: { userId: rating.toUserId },
					data: { reputation: aggregate._avg.score ?? 0 },
				});

				return this.toRecord(created);
			});
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2002'
			)
				throw new RatingAlreadySubmittedError();
			throw error;
		}
	}

	private toRecord(rating: {
		id: string;
		orderId: string;
		fromUserId: string;
		toUserId: string;
		score: number;
		comment: string | null;
		createdAt: Date;
	}): RatingRecord {
		return {
			id: rating.id,
			orderId: rating.orderId,
			fromUserId: rating.fromUserId,
			toUserId: rating.toUserId,
			score: rating.score,
			comment: rating.comment,
			createdAt: rating.createdAt,
		};
	}
}
