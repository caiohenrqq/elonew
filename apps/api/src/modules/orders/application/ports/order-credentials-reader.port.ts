import type { OrderCredentials } from '@modules/orders/domain/order.entity';

export const ORDER_CREDENTIALS_READER_KEY = Symbol(
	'ORDER_CREDENTIALS_READER_KEY',
);

export interface OrderCredentialsReaderPort {
	// Resolves to null unless the order exists, is assigned to this booster and is
	// still in progress: the reveal path must not distinguish those cases. An
	// order matching all three with no credentials stored yet resolves to
	// `{ credentials: null }`.
	findCredentialsForBooster(
		orderId: string,
		boosterId: string,
	): Promise<{ credentials: OrderCredentials | null } | null>;
}
