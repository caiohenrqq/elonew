export const ORDER_CREDENTIAL_REVEAL_RECORDER_KEY = Symbol(
	'ORDER_CREDENTIAL_REVEAL_RECORDER_KEY',
);

export type OrderCredentialRevealInput = {
	orderId: string;
	boosterId: string;
};

export interface OrderCredentialRevealRecorderPort {
	record(reveal: OrderCredentialRevealInput): Promise<void>;
}
