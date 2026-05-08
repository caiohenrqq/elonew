import type {
	FetchPaymentNotificationInput,
	FetchPaymentNotificationOutput,
	InitiatePaymentInput,
	InitiatePaymentOutput,
	PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DevPaymentGatewayAdapter implements PaymentGatewayPort {
	async initiatePayment(
		input: InitiatePaymentInput,
	): Promise<InitiatePaymentOutput> {
		return {
			checkoutUrl: `http://localhost:3001/client?devPaymentId=${encodeURIComponent(input.paymentId)}`,
			gatewayReferenceId: `dev-${input.paymentId}`,
			gatewayStatus: 'pending',
		};
	}

	async fetchPaymentNotification(
		_input: FetchPaymentNotificationInput,
	): Promise<FetchPaymentNotificationOutput> {
		throw new Error(
			'Dev payment gateway does not fetch provider notifications.',
		);
	}
}
