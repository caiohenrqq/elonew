import {
	markPaymentLifecycleLogError,
	type PaymentLifecycleLogEvent,
	PaymentLifecycleLogger,
} from '@modules/payments/application/logging/payment-lifecycle.logger';
import {
	ORDER_CREDENTIAL_CLEANUP_PORT_KEY,
	type OrderCredentialCleanupPort,
} from '@modules/payments/application/ports/order-credential-cleanup.port';
import {
	ORDER_PAYMENT_CONFIRMATION_PORT_KEY,
	type OrderPaymentConfirmationPort,
} from '@modules/payments/application/ports/order-payment-confirmation.port';
import {
	type FetchPaymentNotificationOutput,
	PAYMENT_GATEWAY_PORT_KEY,
	type PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
	type StalePaymentReconciliationCandidate,
} from '@modules/payments/application/ports/payment-repository.port';
import { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Inject, Injectable, Optional } from '@nestjs/common';

const DEFAULT_STALE_AFTER_MINUTES = 15;
const EXPIRE_UNSTARTED_AFTER_HOURS = 24;
const RECONCILIATION_CONCURRENCY = 3;

type ReconcileStaleCheckoutsInput = {
	now: Date;
	limit: number;
};

type ReconcileStaleCheckoutsOutput = {
	skipped: boolean;
	reason?: 'lock_unavailable';
	scannedCount: number;
	confirmedCount: number;
	failedCount: number;
	pendingUpdatedCount: number;
	expiredCount: number;
	skippedCount: number;
	gatewayErrorCount: number;
};

type ReconciliationCounts = Omit<ReconcileStaleCheckoutsOutput, 'skipped'>;

type GatewayResolution = 'confirm' | 'fail' | 'pending' | 'defer';

@Injectable()
export class ReconcileStaleCheckoutsUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(PAYMENT_GATEWAY_PORT_KEY)
		private readonly paymentGatewayPort: PaymentGatewayPort,
		@Inject(ORDER_PAYMENT_CONFIRMATION_PORT_KEY)
		private readonly orderPaymentConfirmationPort: OrderPaymentConfirmationPort,
		@Inject(ORDER_CREDENTIAL_CLEANUP_PORT_KEY)
		private readonly orderCredentialCleanupPort: OrderCredentialCleanupPort,
		@Optional()
		private readonly paymentLifecycleLogger?: PaymentLifecycleLogger,
	) {}

	async execute(
		input: ReconcileStaleCheckoutsInput,
	): Promise<ReconcileStaleCheckoutsOutput> {
		const startedAt = Date.now();
		const counts = this.emptyCounts();
		const logEvent: PaymentLifecycleLogEvent = {
			event: 'payment.lifecycle',
			operation: 'reconcile_stale_checkout',
			gateway: 'MERCADO_PAGO',
		};

		try {
			const result =
				await this.paymentRepository.withStaleCheckoutReconciliationLock(
					async () => {
						const createdBefore = new Date(
							input.now.getTime() - DEFAULT_STALE_AFTER_MINUTES * 60_000,
						);
						const expireCreatedBefore = new Date(
							input.now.getTime() - EXPIRE_UNSTARTED_AFTER_HOURS * 3_600_000,
						);
						const candidates =
							await this.paymentRepository.findStaleAwaitingCheckoutCandidates({
								createdBefore,
								limit: input.limit,
							});
						counts.scannedCount = candidates.length;

						for (
							let index = 0;
							index < candidates.length;
							index += RECONCILIATION_CONCURRENCY
						) {
							await Promise.all(
								candidates
									.slice(index, index + RECONCILIATION_CONCURRENCY)
									.map((candidate) =>
										this.reconcilePayment(
											candidate,
											expireCreatedBefore,
											counts,
										),
									),
							);
						}

						return { skipped: false, ...counts };
					},
				);

			if (!result) {
				const skipped = {
					skipped: true,
					reason: 'lock_unavailable' as const,
					...counts,
				};
				this.attachCounts(logEvent, skipped);
				logEvent.outcome = 'skipped';
				return skipped;
			}

			this.attachCounts(logEvent, result);
			logEvent.outcome = 'success';
			return result;
		} catch (error) {
			this.attachCounts(logEvent, counts);
			markPaymentLifecycleLogError(logEvent, error);
			throw error;
		} finally {
			this.paymentLifecycleLogger?.emit(logEvent, startedAt);
		}
	}

	private async reconcilePayment(
		candidate: StalePaymentReconciliationCandidate,
		expireCreatedBefore: Date,
		counts: ReconciliationCounts,
	): Promise<void> {
		const { payment } = candidate;
		let providerPayment: FetchPaymentNotificationOutput | null;
		try {
			providerPayment = payment.gatewayId
				? await this.paymentGatewayPort.fetchPaymentNotification({
						notificationId: payment.gatewayId,
					})
				: await this.paymentGatewayPort.fetchPaymentByExternalReference(
						payment.id,
					);
		} catch {
			counts.gatewayErrorCount++;
			return;
		}

		if (!providerPayment || providerPayment.internalPaymentId !== payment.id) {
			if (candidate.createdAt >= expireCreatedBefore) {
				counts.skippedCount++;
				return;
			}

			const currentPayment = await this.paymentRepository.findById(payment.id);
			if (
				!currentPayment ||
				currentPayment.status !== PaymentStatus.AWAITING_CONFIRMATION
			) {
				counts.skippedCount++;
				return;
			}

			await this.orderCredentialCleanupPort.clearCredentials(
				currentPayment.orderId,
			);
			currentPayment.fail();
			await this.paymentRepository.save(currentPayment);
			counts.expiredCount++;
			return;
		}

		const currentPayment = await this.paymentRepository.findById(payment.id);
		if (
			!currentPayment ||
			currentPayment.status !== PaymentStatus.AWAITING_CONFIRMATION
		) {
			counts.skippedCount++;
			return;
		}

		currentPayment.attachGatewayDetails({
			gatewayId: providerPayment.gatewayPaymentId,
			gatewayStatus: providerPayment.gatewayStatus,
			gatewayStatusDetail: providerPayment.gatewayStatusDetail,
			gatewayPaymentMethodId: providerPayment.gatewayPaymentMethodId,
			gatewayPaymentTypeId: providerPayment.gatewayPaymentTypeId,
		});

		const resolution = this.resolveGatewayStatus(providerPayment.gatewayStatus);
		if (resolution === 'confirm') {
			await this.orderPaymentConfirmationPort.markAsPaid(
				currentPayment.orderId,
			);
			currentPayment.confirm();
			await this.paymentRepository.save(currentPayment);
			counts.confirmedCount++;
			return;
		}

		if (resolution === 'fail') {
			await this.orderCredentialCleanupPort.clearCredentials(
				currentPayment.orderId,
			);
			currentPayment.fail();
			await this.paymentRepository.save(currentPayment);
			counts.failedCount++;
			return;
		}

		if (resolution === 'pending') {
			await this.paymentRepository.save(currentPayment);
			counts.pendingUpdatedCount++;
			return;
		}

		counts.skippedCount++;
	}

	private resolveGatewayStatus(gatewayStatus: string): GatewayResolution {
		switch (gatewayStatus) {
			case 'approved':
				return 'confirm';
			case 'rejected':
			case 'cancelled':
				return 'fail';
			case 'authorized':
			case 'pending':
			case 'in_process':
				return 'pending';
			default:
				return 'defer';
		}
	}

	private emptyCounts(): ReconciliationCounts {
		return {
			scannedCount: 0,
			confirmedCount: 0,
			failedCount: 0,
			pendingUpdatedCount: 0,
			expiredCount: 0,
			skippedCount: 0,
			gatewayErrorCount: 0,
		};
	}

	private attachCounts(
		logEvent: PaymentLifecycleLogEvent,
		counts: ReconciliationCounts,
	): void {
		logEvent.scanned_count = counts.scannedCount;
		logEvent.confirmed_count = counts.confirmedCount;
		logEvent.failed_count = counts.failedCount;
		logEvent.pending_updated_count = counts.pendingUpdatedCount;
		logEvent.expired_count = counts.expiredCount;
		logEvent.skipped_count = counts.skippedCount;
		logEvent.gateway_error_count = counts.gatewayErrorCount;
	}
}
