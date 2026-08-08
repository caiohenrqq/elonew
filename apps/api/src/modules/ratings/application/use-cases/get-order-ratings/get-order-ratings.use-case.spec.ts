import type { RatingOrderLookupPort } from '@modules/ratings/application/ports/rating-order-lookup.port';
import type {
	RatingRecord,
	RatingRepositoryPort,
} from '@modules/ratings/application/ports/rating-repository.port';
import { GetOrderRatingsUseCase } from '@modules/ratings/application/use-cases/get-order-ratings/get-order-ratings.use-case';
import { Role } from '@packages/auth/roles/role';

describe('GetOrderRatingsUseCase', () => {
	it('allows an admin to inspect ratings for an order', async () => {
		const record: RatingRecord = {
			id: 'rating-1',
			orderId: 'order-1',
			fromUserId: 'client-1',
			toUserId: 'booster-1',
			score: 5,
			comment: 'Ótimo serviço',
			createdAt: new Date('2026-08-04T01:34:36.000Z'),
		};
		const ratings = {
			listForOrder: jest.fn().mockResolvedValue([record]),
		} as unknown as RatingRepositoryPort;
		const orders = {
			findById: jest.fn().mockResolvedValue({
				id: 'order-1',
				clientId: 'client-1',
				boosterId: 'booster-1',
				status: 'completed',
				completedAt: new Date('2026-08-04T01:33:52.000Z'),
			}),
		} as RatingOrderLookupPort;

		const result = await new GetOrderRatingsUseCase(ratings, orders).execute({
			orderId: 'order-1',
			requesterId: 'admin-1',
			requesterRole: Role.ADMIN,
		});

		expect(result).toEqual([
			expect.objectContaining({ id: 'rating-1', score: 5 }),
		]);
	});
});
