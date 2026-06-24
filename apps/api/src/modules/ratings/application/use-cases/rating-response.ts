import type { RatingRecord } from '@modules/ratings/application/ports/rating-repository.port';

export type RatingResponse = {
	id: string;
	orderId: string;
	fromUserId: string;
	toUserId: string;
	score: number;
	comment: string | null;
	createdAt: string;
};

export function mapRatingResponse(record: RatingRecord): RatingResponse {
	return {
		id: record.id,
		orderId: record.orderId,
		fromUserId: record.fromUserId,
		toUserId: record.toUserId,
		score: record.score,
		comment: record.comment,
		createdAt: record.createdAt.toISOString(),
	};
}
