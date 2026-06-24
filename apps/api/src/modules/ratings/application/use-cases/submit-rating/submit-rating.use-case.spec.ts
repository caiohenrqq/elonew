import { OrderStatus } from '@modules/orders/domain/order-status';
import type {
	RatableOrder,
	RatingOrderLookupPort,
} from '@modules/ratings/application/ports/rating-order-lookup.port';
import type {
	RatingRecord,
	RatingRepositoryPort,
} from '@modules/ratings/application/ports/rating-repository.port';
import { SubmitRatingUseCase } from '@modules/ratings/application/use-cases/submit-rating/submit-rating.use-case';
import type { Rating } from '@modules/ratings/domain/rating.entity';
import {
	OrderNotRatableError,
	RatingAlreadySubmittedError,
	RatingNotAllowedError,
	RatingOrderNotFoundError,
	RatingWindowClosedError,
} from '@modules/ratings/domain/rating.errors';

class FakeRatingRepository
	implements RatingRepositoryPort, RatingOrderLookupPort
{
	public orders = new Map<string, RatableOrder>();
	public ratings: RatingRecord[] = [];
	public reputations = new Map<string, number>();

	async findById(orderId: string): Promise<RatableOrder | null> {
		return this.orders.get(orderId) ?? null;
	}

	async findByOrderAndRater(
		orderId: string,
		fromUserId: string,
	): Promise<RatingRecord | null> {
		return (
			this.ratings.find(
				(r) => r.orderId === orderId && r.fromUserId === fromUserId,
			) ?? null
		);
	}

	async listForOrder(orderId: string): Promise<RatingRecord[]> {
		return this.ratings.filter((r) => r.orderId === orderId);
	}

	async save(rating: Rating): Promise<RatingRecord> {
		const record: RatingRecord = {
			id: `rating-${this.ratings.length + 1}`,
			orderId: rating.orderId,
			fromUserId: rating.fromUserId,
			toUserId: rating.toUserId,
			score: rating.score,
			comment: rating.comment,
			createdAt: rating.createdAt,
		};
		this.ratings.push(record);

		const received = this.ratings.filter((r) => r.toUserId === rating.toUserId);
		const average =
			received.reduce((sum, r) => sum + r.score, 0) / received.length;
		this.reputations.set(rating.toUserId, average);

		return record;
	}
}

const COMPLETED_AT = new Date('2026-06-20T00:00:00.000Z');
const NOW = new Date('2026-06-24T00:00:00.000Z');

function completedOrder(overrides?: Partial<RatableOrder>): RatableOrder {
	return {
		id: 'order-1',
		clientId: 'client-1',
		boosterId: 'booster-1',
		status: OrderStatus.COMPLETED,
		completedAt: COMPLETED_AT,
		...overrides,
	};
}

function setup() {
	const repo = new FakeRatingRepository();
	const useCase = new SubmitRatingUseCase(repo, repo);
	return { repo, useCase };
}

describe('SubmitRatingUseCase', () => {
	it('lets the client rate the booster and updates booster reputation', async () => {
		const { repo, useCase } = setup();
		repo.orders.set('order-1', completedOrder());

		const result = await useCase.execute({
			raterId: 'client-1',
			orderId: 'order-1',
			score: 4,
			now: NOW,
		});

		expect(result.fromUserId).toBe('client-1');
		expect(result.toUserId).toBe('booster-1');
		expect(repo.reputations.get('booster-1')).toBe(4);
	});

	it('lets the booster rate the client (other direction)', async () => {
		const { repo, useCase } = setup();
		repo.orders.set('order-1', completedOrder());

		const result = await useCase.execute({
			raterId: 'booster-1',
			orderId: 'order-1',
			score: 5,
			now: NOW,
		});

		expect(result.toUserId).toBe('client-1');
		expect(repo.reputations.get('client-1')).toBe(5);
	});

	it('averages multiple ratings received by a user', async () => {
		const { repo, useCase } = setup();
		repo.orders.set('order-1', completedOrder());
		repo.orders.set(
			'order-2',
			completedOrder({ id: 'order-2', clientId: 'client-2' }),
		);

		await useCase.execute({
			raterId: 'client-1',
			orderId: 'order-1',
			score: 5,
			now: NOW,
		});
		await useCase.execute({
			raterId: 'client-2',
			orderId: 'order-2',
			score: 3,
			now: NOW,
		});

		expect(repo.reputations.get('booster-1')).toBe(4);
	});

	it('rejects an unknown order', async () => {
		const { useCase } = setup();
		await expect(
			useCase.execute({
				raterId: 'client-1',
				orderId: 'missing',
				score: 5,
				now: NOW,
			}),
		).rejects.toThrow(RatingOrderNotFoundError);
	});

	it('rejects rating an order that is not completed', async () => {
		const { repo, useCase } = setup();
		repo.orders.set(
			'order-1',
			completedOrder({ status: OrderStatus.IN_PROGRESS }),
		);

		await expect(
			useCase.execute({
				raterId: 'client-1',
				orderId: 'order-1',
				score: 5,
				now: NOW,
			}),
		).rejects.toThrow(OrderNotRatableError);
	});

	it('rejects a rater who is not on the order', async () => {
		const { repo, useCase } = setup();
		repo.orders.set('order-1', completedOrder());

		await expect(
			useCase.execute({
				raterId: 'stranger',
				orderId: 'order-1',
				score: 5,
				now: NOW,
			}),
		).rejects.toThrow(RatingNotAllowedError);
	});

	it('rejects a rating submitted after the window closes', async () => {
		const { repo, useCase } = setup();
		repo.orders.set('order-1', completedOrder());
		const late = new Date(COMPLETED_AT.getTime() + 15 * 24 * 60 * 60 * 1000);

		await expect(
			useCase.execute({
				raterId: 'client-1',
				orderId: 'order-1',
				score: 5,
				now: late,
			}),
		).rejects.toThrow(RatingWindowClosedError);
	});

	it('rejects a second rating in the same direction', async () => {
		const { repo, useCase } = setup();
		repo.orders.set('order-1', completedOrder());

		await useCase.execute({
			raterId: 'client-1',
			orderId: 'order-1',
			score: 5,
			now: NOW,
		});

		await expect(
			useCase.execute({
				raterId: 'client-1',
				orderId: 'order-1',
				score: 1,
				now: NOW,
			}),
		).rejects.toThrow(RatingAlreadySubmittedError);
	});
});
