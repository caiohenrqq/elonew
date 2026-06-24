import {
	RATING_ORDER_LOOKUP_KEY,
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
import {
	RatingNotAllowedError,
	RatingOrderNotFoundError,
} from '@modules/ratings/domain/rating.errors';
import { Inject, Injectable } from '@nestjs/common';

type GetOrderRatingsInput = {
	orderId: string;
	requesterId: string;
};

@Injectable()
export class GetOrderRatingsUseCase {
	constructor(
		@Inject(RATING_REPOSITORY_KEY)
		private readonly ratings: RatingRepositoryPort,
		@Inject(RATING_ORDER_LOOKUP_KEY)
		private readonly orders: RatingOrderLookupPort,
	) {}

	async execute(input: GetOrderRatingsInput): Promise<RatingResponse[]> {
		const order = await this.orders.findById(input.orderId);
		if (!order) throw new RatingOrderNotFoundError();
		if (
			input.requesterId !== order.clientId &&
			input.requesterId !== order.boosterId
		)
			throw new RatingNotAllowedError();

		const records = await this.ratings.listForOrder(input.orderId);
		return records.map(mapRatingResponse);
	}
}
