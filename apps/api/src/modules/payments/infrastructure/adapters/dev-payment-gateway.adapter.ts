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
	initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
		return Promise.resolve({
			checkoutUrl: `http://localhost:3001/client?devPaymentId=${encodeURIComponent(input.paymentId)}`,
			gatewayReferenceId: `dev-${input.paymentId}`,
			gatewayStatus: 'pending',
		});
	}

	fetchPaymentNotification(
		_input: FetchPaymentNotificationInput,
	): Promise<FetchPaymentNotificationOutput> {
		return Promise.reject(
			new Error('Dev payment gateway does not fetch provider notifications.'),
		);
	}
}
