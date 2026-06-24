import type { Rating } from '@modules/ratings/domain/rating.entity';

export const RATING_REPOSITORY_KEY = Symbol('RATING_REPOSITORY_KEY');

export type RatingRecord = {
	id: string;
	orderId: string;
	fromUserId: string;
	toUserId: string;
	score: number;
	comment: string | null;
	createdAt: Date;
};

export interface RatingRepositoryPort {
	findByOrderAndRater(
		orderId: string,
		fromUserId: string,
	): Promise<RatingRecord | null>;
	listForOrder(orderId: string): Promise<RatingRecord[]>;
	save(rating: Rating): Promise<RatingRecord>;
}
