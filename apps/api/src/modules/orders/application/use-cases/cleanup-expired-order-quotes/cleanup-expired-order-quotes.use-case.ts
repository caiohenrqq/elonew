import {
	OrderQuoteCleanupLifecycleLogger,
	type OrderQuoteCleanupLifecycleLoggerPort,
} from '@modules/orders/application/logging/order-quote-cleanup-lifecycle.logger';
import {
	ORDER_QUOTE_REPOSITORY_KEY,
	type OrderQuoteRepositoryPort,
} from '@modules/orders/application/ports/order-quote-repository.port';
import { Inject, Injectable, Optional } from '@nestjs/common';

const ORDER_QUOTE_CLEANUP_RETENTION_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type CleanupExpiredOrderQuotesInput = {
	now: Date;
	limit: number;
};

type CleanupExpiredOrderQuotesOutput = {
	deletedCount: number;
	expiresBefore: string;
};

@Injectable()
export class CleanupExpiredOrderQuotesUseCase {
	constructor(
		@Inject(ORDER_QUOTE_REPOSITORY_KEY)
		private readonly orderQuoteRepository: OrderQuoteRepositoryPort,
		@Optional()
		@Inject(OrderQuoteCleanupLifecycleLogger)
		private readonly lifecycleLogger?: OrderQuoteCleanupLifecycleLoggerPort,
	) {}

	async execute(
		input: CleanupExpiredOrderQuotesInput,
	): Promise<CleanupExpiredOrderQuotesOutput> {
		const startedAt = Date.now();
		const expiresBefore = new Date(
			input.now.getTime() - ORDER_QUOTE_CLEANUP_RETENTION_DAYS * DAY_IN_MS,
		);
		let deletedCount = 0;
		let outcome: 'success' | 'error' = 'success';

		try {
			const result = await this.orderQuoteRepository.cleanupExpiredUnused({
				expiresBefore,
				limit: input.limit,
			});
			deletedCount = result.deletedCount;

			return {
				deletedCount,
				expiresBefore: expiresBefore.toISOString(),
			};
		} catch (error) {
			outcome = 'error';
			this.lifecycleLogger?.emit({
				event: 'order_quote_cleanup.lifecycle',
				operation: 'cleanup_expired_unused',
				outcome: 'error',
				duration_ms: Date.now() - startedAt,
				deleted_count: deletedCount,
				expires_before: expiresBefore.toISOString(),
				limit: input.limit,
				error_type: error instanceof Error ? error.constructor.name : 'Error',
				error_message: error instanceof Error ? error.message : String(error),
			});
			throw error;
		} finally {
			if (outcome === 'success') {
				this.lifecycleLogger?.emit({
					event: 'order_quote_cleanup.lifecycle',
					operation: 'cleanup_expired_unused',
					outcome,
					duration_ms: Date.now() - startedAt,
					deleted_count: deletedCount,
					expires_before: expiresBefore.toISOString(),
					limit: input.limit,
				});
			}
		}
	}
}
