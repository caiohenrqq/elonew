import { AppSettingsService } from '@app/common/settings/app-settings.service';
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
	constructor(private readonly appSettings: AppSettingsService) {}

	initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
		const checkoutUrl = new URL('/client', this.appSettings.devCheckoutAppUrl);
		checkoutUrl.searchParams.set('devPaymentId', input.paymentId);

		return Promise.resolve({
			checkoutUrl: checkoutUrl.toString(),
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
