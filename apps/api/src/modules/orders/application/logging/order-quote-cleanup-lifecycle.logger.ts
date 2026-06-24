import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

type OrderQuoteCleanupLifecycleEvent = {
	event: 'order_quote_cleanup.lifecycle';
	operation: 'cleanup_expired_unused';
	outcome: 'success' | 'error';
	duration_ms: number;
	deleted_count: number;
	expires_before: string;
	limit: number;
	error_type?: string;
	error_message?: string;
};

@Injectable()
export class OrderQuoteCleanupLifecycleLogger {
	constructor(private readonly logger: PinoLogger) {
		this.logger.setContext(OrderQuoteCleanupLifecycleLogger.name);
	}

	emit(event: OrderQuoteCleanupLifecycleEvent): void {
		if (event.outcome === 'error') {
			this.logger.error(event);
			return;
		}

		this.logger.info(event);
	}
}

export type OrderQuoteCleanupLifecycleLoggerPort = Pick<
	OrderQuoteCleanupLifecycleLogger,
	'emit'
>;
