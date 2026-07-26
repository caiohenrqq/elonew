import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

// Credential values are absent by construction: the event type has no field that
// could carry them.
export type OrderCredentialsAccessLogEvent = {
	event: 'order.credentials_reveal';
	outcome?: 'success' | 'denied' | 'error';
	duration_ms?: number;
	order_id: string;
	booster_id: string;
	// Only the error class name: a message could carry a decrypted value.
	error_type?: string;
};

@Injectable()
export class OrderCredentialsAccessLogger {
	constructor(private readonly logger: PinoLogger) {
		this.logger.setContext(OrderCredentialsAccessLogger.name);
	}

	emit(event: OrderCredentialsAccessLogEvent, startedAt: number): void {
		event.duration_ms = Date.now() - startedAt;

		if (event.outcome === 'error') this.logger.error(event);
		else this.logger.info(event);
	}
}
