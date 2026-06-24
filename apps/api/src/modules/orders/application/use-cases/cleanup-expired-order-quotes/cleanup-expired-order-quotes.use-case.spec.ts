import type { OrderQuoteRepositoryPort } from '@modules/orders/application/ports/order-quote-repository.port';
import { CleanupExpiredOrderQuotesUseCase } from './cleanup-expired-order-quotes.use-case';

class InMemoryOrderQuoteRepository implements OrderQuoteRepositoryPort {
	readonly cleanupCalls: Array<{ expiresBefore: Date; limit: number }> = [];

	async create(): Promise<{ id: string }> {
		return { id: 'quote-1' };
	}

	async consumeByIdForClient(): Promise<never> {
		throw new Error('Not used in this test.');
	}

	async restoreConsumedByIdForClient(): Promise<void> {}

	async cleanupExpiredUnused(input: {
		expiresBefore: Date;
		limit: number;
	}): Promise<{ deletedCount: number }> {
		this.cleanupCalls.push(input);
		return { deletedCount: 3 };
	}
}

class OrderQuoteCleanupLoggerSpy {
	readonly events: unknown[] = [];

	emit(event: unknown): void {
		this.events.push(event);
	}
}

describe('CleanupExpiredOrderQuotesUseCase', () => {
	it('deletes quotes expired before the retention cutoff', async () => {
		const repository = new InMemoryOrderQuoteRepository();
		const useCase = new CleanupExpiredOrderQuotesUseCase(repository);
		const now = new Date('2026-06-12T12:00:00.000Z');

		await expect(useCase.execute({ now, limit: 500 })).resolves.toEqual({
			deletedCount: 3,
			expiresBefore: '2026-06-05T12:00:00.000Z',
		});
		expect(repository.cleanupCalls).toEqual([
			{
				expiresBefore: new Date('2026-06-05T12:00:00.000Z'),
				limit: 500,
			},
		]);
	});

	it('emits a cleanup lifecycle event', async () => {
		const repository = new InMemoryOrderQuoteRepository();
		const logger = new OrderQuoteCleanupLoggerSpy();
		const useCase = new CleanupExpiredOrderQuotesUseCase(repository, logger);
		const now = new Date('2026-06-12T12:00:00.000Z');

		await useCase.execute({ now, limit: 500 });

		expect(logger.events).toEqual([
			expect.objectContaining({
				event: 'order_quote_cleanup.lifecycle',
				operation: 'cleanup_expired_unused',
				outcome: 'success',
				deleted_count: 3,
				expires_before: '2026-06-05T12:00:00.000Z',
				limit: 500,
				duration_ms: expect.any(Number),
			}),
		]);
	});
});
