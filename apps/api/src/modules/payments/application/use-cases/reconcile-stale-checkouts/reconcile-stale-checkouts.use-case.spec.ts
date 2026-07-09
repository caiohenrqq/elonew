import type { OrderCredentialCleanupPort } from '@modules/payments/application/ports/order-credential-cleanup.port';
import type { OrderPaymentConfirmationPort } from '@modules/payments/application/ports/order-payment-confirmation.port';
import type {
	FetchPaymentNotificationOutput,
	PaymentGatewayPort,
} from '@modules/payments/application/ports/payment-gateway.port';
import type { StalePaymentReconciliationCandidate } from '@modules/payments/application/ports/payment-repository.port';
import { Payment } from '@modules/payments/domain/payment.entity';
import { InMemoryPaymentRepository } from '../../../../../../test/support/in-memory/payments/in-memory-payment.repository';
import { ReconcileStaleCheckoutsUseCase } from './reconcile-stale-checkouts.use-case';

class PaymentRepositoryStub extends InMemoryPaymentRepository {
	lockAvailable = true;
	candidates: StalePaymentReconciliationCandidate[] = [];

	override async findStaleAwaitingCheckoutCandidates(): Promise<
		StalePaymentReconciliationCandidate[]
	> {
		return this.candidates;
	}

	override async withStaleCheckoutReconciliationLock<T>(
		callback: () => Promise<T>,
	): Promise<T | null> {
		if (!this.lockAvailable) return null;
		return await callback();
	}

	override insert(payment: Payment): void {
		super.insert(payment);
		this.candidates.push({ payment });
	}
}

class PaymentGatewayStub implements PaymentGatewayPort {
	readonly fetchIds: string[] = [];
	readonly externalReferences: string[] = [];
	notifications = new Map<string, FetchPaymentNotificationOutput | null>();
	shouldFail = false;

	async initiatePayment(): Promise<never> {
		throw new Error('not needed in this test');
	}

	async fetchPaymentNotification(input: {
		notificationId: string;
	}): Promise<FetchPaymentNotificationOutput> {
		this.fetchIds.push(input.notificationId);
		if (this.shouldFail) throw new Error('gateway down');
		const notification = this.notifications.get(input.notificationId);
		if (!notification) throw new Error('payment not found');
		return notification;
	}

	async fetchPaymentByExternalReference(
		externalReference: string,
	): Promise<FetchPaymentNotificationOutput | null> {
		this.externalReferences.push(externalReference);
		if (this.shouldFail) throw new Error('gateway down');
		return this.notifications.get(externalReference) ?? null;
	}
}

class OrderPaymentConfirmationSpy implements OrderPaymentConfirmationPort {
	readonly orderIds: string[] = [];
	shouldFail = false;

	async markAsPaid(orderId: string): Promise<void> {
		if (this.shouldFail) throw new Error('order update failed');
		this.orderIds.push(orderId);
	}
}

class OrderCredentialCleanupSpy implements OrderCredentialCleanupPort {
	readonly orderIds: string[] = [];
	shouldFail = false;

	async clearCredentials(orderId: string): Promise<void> {
		if (this.shouldFail) throw new Error('credential cleanup failed');
		this.orderIds.push(orderId);
	}
}

const makePayment = (id: string, gatewayId: string | null = `mp-${id}`) => {
	const payment = Payment.create({
		id,
		orderId: `order-${id}`,
		grossAmount: 100,
		paymentMethod: 'pix',
	});
	payment.attachGatewayDetails({
		gatewayId,
		gatewayStatus: 'pending',
	});
	return payment;
};

const makeProviderPayment = (
	paymentId: string,
	status: string,
	statusDetail: string | null,
): FetchPaymentNotificationOutput => ({
	internalPaymentId: paymentId,
	gatewayPaymentId: `mp-${paymentId}`,
	gatewayStatus: status,
	gatewayStatusDetail: statusDetail,
	gatewayPaymentMethodId: 'pix',
	gatewayPaymentTypeId: 'bank_transfer',
});

const makeUseCase = () => {
	const repository = new PaymentRepositoryStub();
	const gateway = new PaymentGatewayStub();
	const confirmation = new OrderPaymentConfirmationSpy();
	const cleanup = new OrderCredentialCleanupSpy();
	const useCase = new ReconcileStaleCheckoutsUseCase(
		repository,
		gateway,
		confirmation,
		cleanup,
	);

	return { repository, gateway, confirmation, cleanup, useCase };
};

const runAt = new Date('2026-07-09T18:00:00.000Z');

describe('ReconcileStaleCheckoutsUseCase', () => {
	it('confirms approved provider payments', async () => {
		const { repository, gateway, confirmation, useCase } = makeUseCase();
		const payment = makePayment('payment-1');
		repository.insert(payment);
		gateway.notifications.set(
			'mp-payment-1',
			makeProviderPayment('payment-1', 'approved', 'accredited'),
		);

		const result = await useCase.execute({ now: runAt, limit: 50 });

		expect(result).toMatchObject({
			skipped: false,
			scannedCount: 1,
			confirmedCount: 1,
		});
		expect(payment.status).toBe('held');
		expect(payment.gatewayPaymentMethodId).toBe('pix');
		expect(payment.gatewayPaymentTypeId).toBe('bank_transfer');
		expect(confirmation.orderIds).toEqual(['order-payment-1']);
	});

	it('fails rejected provider payments and clears credentials', async () => {
		const { repository, gateway, cleanup, useCase } = makeUseCase();
		const payment = makePayment('payment-2');
		repository.insert(payment);
		gateway.notifications.set(
			'mp-payment-2',
			makeProviderPayment('payment-2', 'rejected', 'cc_rejected_high_risk'),
		);

		const result = await useCase.execute({ now: runAt, limit: 50 });

		expect(result.failedCount).toBe(1);
		expect(payment.status).toBe('failed');
		expect(cleanup.orderIds).toEqual(['order-payment-2']);
	});

	it('updates pending provider metadata without changing payment status', async () => {
		const { repository, gateway, useCase } = makeUseCase();
		const payment = makePayment('payment-3');
		repository.insert(payment);
		gateway.notifications.set(
			'mp-payment-3',
			makeProviderPayment('payment-3', 'pending', 'pending_waiting_transfer'),
		);

		const result = await useCase.execute({ now: runAt, limit: 50 });

		expect(result.pendingUpdatedCount).toBe(1);
		expect(payment.status).toBe('awaiting_confirmation');
		expect(payment.gatewayStatus).toBe('pending');
		expect(payment.gatewayStatusDetail).toBe('pending_waiting_transfer');
	});

	it('uses external reference search when the gateway payment id is missing', async () => {
		const { repository, gateway, useCase } = makeUseCase();
		const payment = makePayment('payment-4', null);
		repository.insert(payment);
		gateway.notifications.set(
			'payment-4',
			makeProviderPayment('payment-4', 'pending', 'pending_waiting_transfer'),
		);

		await useCase.execute({ now: runAt, limit: 50 });

		expect(gateway.externalReferences).toEqual(['payment-4']);
		expect(gateway.fetchIds).toEqual([]);
		expect(payment.gatewayId).toBe('mp-payment-4');
	});

	it('counts gateway failures and leaves payment state unchanged', async () => {
		const { repository, gateway, useCase } = makeUseCase();
		const payment = makePayment('payment-5');
		repository.insert(payment);
		gateway.shouldFail = true;

		const result = await useCase.execute({ now: runAt, limit: 50 });

		expect(result.gatewayErrorCount).toBe(1);
		expect(payment.status).toBe('awaiting_confirmation');
	});

	it('does not overwrite payments that changed after candidate selection', async () => {
		const { repository, gateway, confirmation, useCase } = makeUseCase();
		const staleCandidate = makePayment('payment-concurrent');
		const currentPayment = makePayment('payment-concurrent');
		currentPayment.confirm();
		repository.candidates.push({ payment: staleCandidate });
		await repository.save(currentPayment);
		gateway.notifications.set(
			'mp-payment-concurrent',
			makeProviderPayment(
				'payment-concurrent',
				'pending',
				'pending_waiting_transfer',
			),
		);

		const result = await useCase.execute({ now: runAt, limit: 50 });

		expect(result.skippedCount).toBe(1);
		expect(currentPayment.status).toBe('held');
		expect(confirmation.orderIds).toEqual([]);
	});

	it('keeps approved payments retryable when marking the order as paid fails', async () => {
		const { repository, gateway, confirmation, useCase } = makeUseCase();
		const payment = makePayment('payment-6');
		repository.insert(payment);
		confirmation.shouldFail = true;
		gateway.notifications.set(
			'mp-payment-6',
			makeProviderPayment('payment-6', 'approved', 'accredited'),
		);

		await expect(useCase.execute({ now: runAt, limit: 50 })).rejects.toThrow(
			'order update failed',
		);

		expect(payment.status).toBe('awaiting_confirmation');
	});

	it('keeps rejected payments retryable when credential cleanup fails', async () => {
		const { repository, gateway, cleanup, useCase } = makeUseCase();
		const payment = makePayment('payment-7');
		repository.insert(payment);
		cleanup.shouldFail = true;
		gateway.notifications.set(
			'mp-payment-7',
			makeProviderPayment('payment-7', 'rejected', 'cc_rejected_high_risk'),
		);

		await expect(useCase.execute({ now: runAt, limit: 50 })).rejects.toThrow(
			'credential cleanup failed',
		);

		expect(payment.status).toBe('awaiting_confirmation');
	});

	it('skips the run when another reconciliation holds the advisory lock', async () => {
		const { repository, useCase } = makeUseCase();
		repository.lockAvailable = false;

		await expect(useCase.execute({ now: runAt, limit: 50 })).resolves.toEqual({
			skipped: true,
			reason: 'lock_unavailable',
			scannedCount: 0,
			confirmedCount: 0,
			failedCount: 0,
			pendingUpdatedCount: 0,
			skippedCount: 0,
			gatewayErrorCount: 0,
		});
	});
});
