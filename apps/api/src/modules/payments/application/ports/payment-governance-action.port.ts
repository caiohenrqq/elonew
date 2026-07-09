export const PAYMENT_GOVERNANCE_ACTION_PORT_KEY = Symbol(
	'PAYMENT_GOVERNANCE_ACTION_PORT_KEY',
);

export interface PaymentGovernanceActionPort {
	recordLateApprovedAfterExpiration(input: {
		paymentId: string;
		orderId: string;
	}): Promise<void>;
}
