import {
	InvalidRatingScoreError,
	RatingNotAllowedError,
} from './rating.errors';

const MIN_SCORE = 1;
const MAX_SCORE = 5;

export class Rating {
	private constructor(
		public readonly id: string,
		public readonly orderId: string,
		public readonly fromUserId: string,
		public readonly toUserId: string,
		public readonly score: number,
		public readonly comment: string | null,
		public readonly createdAt: Date,
	) {}

	static create(input: {
		id?: string;
		orderId: string;
		fromUserId: string;
		toUserId: string;
		score: number;
		comment?: string | null;
		now: Date;
	}): Rating {
		if (!Number.isInteger(input.score)) throw new InvalidRatingScoreError();
		if (input.score < MIN_SCORE || input.score > MAX_SCORE)
			throw new InvalidRatingScoreError();
		if (input.fromUserId === input.toUserId) throw new RatingNotAllowedError();

		return new Rating(
			input.id ?? '',
			input.orderId,
			input.fromUserId,
			input.toUserId,
			input.score,
			input.comment ?? null,
			input.now,
		);
	}
}
