export const ORDER_CREDENTIAL_CLEANUP_PORT_KEY = Symbol(
	'ORDER_CREDENTIAL_CLEANUP_PORT_KEY',
);

export interface OrderCredentialCleanupPort {
	clearCredentials(orderId: string): Promise<void>;
}
