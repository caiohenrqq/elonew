import { PaymentGatewayError } from '@modules/payments/domain/payment.errors';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

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
	back_url?: string;
	webhook_event_id?: string;
	webhook_topic?: string;
	webhook_resource_id?: string;
	webhook_request_id?: string;
	webhook_signature_valid?: boolean;
	webhook_processed_event_key?: string;
	webhook_already_processed?: boolean;
	webhook_resolution?: string;
	webhook_ignored_reason?: string;
	side_effects?: string[];
	error_type?: string;
	error_message?: string;
	gateway_error_operation?: string;
	gateway_error_status?: number;
	gateway_error_cause?: string[];
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

	if (error instanceof PaymentGatewayError) {
		event.gateway_error_operation = error.operation;
		if (error.gatewayStatus !== null)
			event.gateway_error_status = error.gatewayStatus;
		if (error.gatewayCause.length > 0)
			event.gateway_error_cause = error.gatewayCause;
		if (error.cause instanceof Error) event.error_message = error.cause.message;
	}
}

@Injectable()
export class PaymentLifecycleLogger {
	constructor(private readonly logger: PinoLogger) {
		this.logger.setContext(PaymentLifecycleLogger.name);
	}

	emit(event: PaymentLifecycleLogEvent, startedAt: number): void {
		event.duration_ms = Date.now() - startedAt;

		if (event.outcome === 'error') this.logger.error(event);
		else this.logger.info(event);
	}
}
