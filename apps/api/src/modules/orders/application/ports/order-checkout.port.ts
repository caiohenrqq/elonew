import { Order } from '@modules/orders/domain/order.entity';
import type { PaymentMethod } from '@packages/shared/payments/payment-method';

export const ORDER_CHECKOUT_PORT_KEY = Symbol('ORDER_CHECKOUT_PORT_KEY');

export type CheckoutPaymentPayload = {
	id: string;
	status: string;
	grossAmount: number;
	boosterAmount: number;
	paymentMethod: PaymentMethod;
	gateway: string;
	gatewayReferenceId: string | null;
	gatewayId: string | null;
	gatewayStatus: string | null;
	gatewayStatusDetail: string | null;
	checkoutUrl: string | null;
};

export interface OrderCheckoutPort {
	createDraftOrderFromOwnedQuote(input: {
		orderId: string;
		clientId: string;
		boosterId?: string;
		quoteId: string;
		now: Date;
		payment?: CheckoutPaymentPayload;
	}): Promise<Order>;

	findOwnedQuoteTotalAmount(input: {
		quoteId: string;
		clientId: string;
	}): Promise<number | null>;
}
