import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export type PaymentLifecycleLogEvent = {
	event: 'payment.lifecycle';
	operation:
		| 'create'
		| 'resume_checkout'
		| 'confirm'
		| 'fail'
		| 'release_hold'
		| 'simulate_dev_outcome'
		| 'mercadopago_webhook';
	outcome?: 'success' | 'error' | 'skipped';
	duration_ms?: number;
	client_id?: string;
	order_id?: string;
	payment_id?: string;
	payment_method?: string;
	payment_status_before?: string;
	payment_status_after?: string;
	order_status?: string;
	gross_amount?: number;
	booster_amount?: number;
	gateway?: 'MERCADO_PAGO';
	gateway_reference_id?: string;
	gateway_payment_id?: string;
	gateway_status?: string;
	gateway_status_detail?: string;
	checkout_url_present?: boolean;
	webhook_event_id?: string;
	webhook_topic?: string;
	webhook_resource_id?: string;
	webhook_request_id?: string;
	webhook_signature_valid?: boolean;
	webhook_processed_event_key?: string;
	webhook_already_processed?: boolean;
	webhook_resolution?: string;
	side_effects?: string[];
	error_type?: string;
	error_message?: string;
};

export function markPaymentLifecycleLogError(
	event: PaymentLifecycleLogEvent,
	error: unknown,
): void {
	event.outcome = 'error';
	event.error_type =
		error instanceof Error ? error.constructor.name : typeof error;
	event.error_message =
		error instanceof Error ? error.message : 'Unknown error';
}

@Injectable()
export class PaymentLifecycleLogger {
	constructor(
		@InjectPinoLogger(PaymentLifecycleLogger.name)
		private readonly logger: PinoLogger,
	) {}

	emit(event: PaymentLifecycleLogEvent, startedAt: number): void {
		event.duration_ms = Date.now() - startedAt;

		if (event.outcome === 'error') this.logger.error(event);
		else this.logger.info(event);
	}
}
