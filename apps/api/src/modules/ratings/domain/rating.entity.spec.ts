import { Rating } from '@modules/ratings/domain/rating.entity';
import {
	InvalidRatingScoreError,
	RatingNotAllowedError,
} from '@modules/ratings/domain/rating.errors';

const baseInput = {
	orderId: 'order-1',
	fromUserId: 'client-1',
	toUserId: 'booster-1',
	score: 5,
	now: new Date('2026-06-24T00:00:00.000Z'),
};

describe('Rating.create', () => {
	it('creates a valid rating', () => {
		const rating = Rating.create(baseInput);

		expect(rating.score).toBe(5);
		expect(rating.fromUserId).toBe('client-1');
		expect(rating.toUserId).toBe('booster-1');
		expect(rating.comment).toBeNull();
	});

	it.each([0, 6, -1])('rejects out-of-range score %p', (score) => {
		expect(() => Rating.create({ ...baseInput, score })).toThrow(
			InvalidRatingScoreError,
		);
	});

	it('rejects a non-integer score', () => {
		expect(() => Rating.create({ ...baseInput, score: 4.5 })).toThrow(
			InvalidRatingScoreError,
		);
	});

	it('rejects rating yourself', () => {
		expect(() =>
			Rating.create({ ...baseInput, toUserId: baseInput.fromUserId }),
		).toThrow(RatingNotAllowedError);
	});
});
