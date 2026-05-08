import {
	ORDER_CREDENTIAL_CLEANUP_PORT_KEY,
	type OrderCredentialCleanupPort,
} from '@modules/payments/application/ports/order-credential-cleanup.port';
import {
	ORDER_PAYMENT_CONFIRMATION_PORT_KEY,
	type OrderPaymentConfirmationPort,
} from '@modules/payments/application/ports/order-payment-confirmation.port';
import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import { PaymentNotFoundError } from '@modules/payments/domain/payment.errors';
import type { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Inject, Injectable } from '@nestjs/common';

export const devPaymentOutcomeValues = [
	'approved',
	'authorized',
	'pending',
	'in_process',
	'rejected',
	'cancelled',
] as const;

export type DevPaymentOutcome = (typeof devPaymentOutcomeValues)[number];

type SimulateDevPaymentOutcomeInput = {
	paymentId: string;
	clientId: string;
	outcome: DevPaymentOutcome;
};

type SimulateDevPaymentOutcomeOutput = {
	id: string;
	orderId: string;
	status: PaymentStatus;
	gatewayStatus: string | null;
	gatewayStatusDetail: string | null;
};

@Injectable()
export class SimulateDevPaymentOutcomeUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(ORDER_PAYMENT_CONFIRMATION_PORT_KEY)
		private readonly orderPaymentConfirmationPort: OrderPaymentConfirmationPort,
		@Inject(ORDER_CREDENTIAL_CLEANUP_PORT_KEY)
		private readonly orderCredentialCleanupPort: OrderCredentialCleanupPort,
	) {}

	async execute(
		input: SimulateDevPaymentOutcomeInput,
	): Promise<SimulateDevPaymentOutcomeOutput> {
		const payment = await this.paymentRepository.findByIdForClient(
			input.paymentId,
			input.clientId,
		);
		if (!payment) throw new PaymentNotFoundError();

		payment.attachGatewayDetails({
			gatewayId: `dev-${payment.id}`,
			gatewayStatus: input.outcome,
			gatewayStatusDetail: this.resolveGatewayStatusDetail(input.outcome),
		});

		if (input.outcome === 'approved') payment.confirm();
		if (input.outcome === 'rejected' || input.outcome === 'cancelled')
			payment.fail();

		await this.paymentRepository.save(payment);

		if (input.outcome === 'approved')
			await this.orderPaymentConfirmationPort.markAsPaid(payment.orderId);
		if (input.outcome === 'rejected' || input.outcome === 'cancelled')
			await this.orderCredentialCleanupPort.clearCredentials(payment.orderId);

		return {
			id: payment.id,
			orderId: payment.orderId,
			status: payment.status,
			gatewayStatus: payment.gatewayStatus,
			gatewayStatusDetail: payment.gatewayStatusDetail,
		};
	}

	private resolveGatewayStatusDetail(outcome: DevPaymentOutcome): string {
		switch (outcome) {
			case 'approved':
				return 'accredited';
			case 'authorized':
				return 'pending_capture';
			case 'pending':
				return 'pending_waiting_payment';
			case 'in_process':
				return 'pending_contingency';
			case 'rejected':
				return 'cc_rejected_other_reason';
			case 'cancelled':
				return 'cancelled_by_dev_simulation';
		}
	}
}
