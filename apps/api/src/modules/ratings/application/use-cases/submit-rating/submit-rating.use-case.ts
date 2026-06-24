import { OrderStatus } from '@modules/orders/domain/order-status';
import {
	RATING_ORDER_LOOKUP_KEY,
	type RatableOrder,
	type RatingOrderLookupPort,
} from '@modules/ratings/application/ports/rating-order-lookup.port';
import {
	RATING_REPOSITORY_KEY,
	type RatingRepositoryPort,
} from '@modules/ratings/application/ports/rating-repository.port';
import {
	mapRatingResponse,
	type RatingResponse,
} from '@modules/ratings/application/use-cases/rating-response';
import { Rating } from '@modules/ratings/domain/rating.entity';
import {
	OrderNotRatableError,
	RatingAlreadySubmittedError,
	RatingNotAllowedError,
	RatingOrderNotFoundError,
	RatingWindowClosedError,
} from '@modules/ratings/domain/rating.errors';
import { Inject, Injectable } from '@nestjs/common';

// ponytail: window as a const; lift to env/config if product wants it tunable
const RATING_WINDOW_DAYS = 14;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type SubmitRatingInput = {
	raterId: string;
	orderId: string;
	score: number;
	comment?: string;
	now?: Date;
};

@Injectable()
export class SubmitRatingUseCase {
	constructor(
		@Inject(RATING_REPOSITORY_KEY)
		private readonly ratings: RatingRepositoryPort,
		@Inject(RATING_ORDER_LOOKUP_KEY)
		private readonly orders: RatingOrderLookupPort,
	) {}

	async execute(input: SubmitRatingInput): Promise<RatingResponse> {
		const now = input.now ?? new Date();
		const order = await this.orders.findById(input.orderId);
		if (!order) throw new RatingOrderNotFoundError();
		if (order.status !== OrderStatus.COMPLETED)
			throw new OrderNotRatableError();

		const toUserId = this.resolveCounterparty(order, input.raterId);
		this.assertWithinWindow(order.completedAt, now);

		const existing = await this.ratings.findByOrderAndRater(
			input.orderId,
			input.raterId,
		);
		if (existing) throw new RatingAlreadySubmittedError();

		const rating = Rating.create({
			orderId: input.orderId,
			fromUserId: input.raterId,
			toUserId,
			score: input.score,
			comment: input.comment ?? null,
			now,
		});

		return mapRatingResponse(await this.ratings.save(rating));
	}

	private resolveCounterparty(order: RatableOrder, raterId: string): string {
		if (raterId === order.clientId && order.boosterId) return order.boosterId;
		if (raterId === order.boosterId && order.clientId) return order.clientId;
		throw new RatingNotAllowedError();
	}

	private assertWithinWindow(completedAt: Date | null, now: Date): void {
		if (!completedAt) throw new RatingWindowClosedError();
		const elapsed = now.getTime() - completedAt.getTime();
		if (elapsed > RATING_WINDOW_DAYS * DAY_IN_MS)
			throw new RatingWindowClosedError();
	}
}
