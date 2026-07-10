import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	PaymentRepositoryPort,
	StalePaymentReconciliationCandidate,
} from '@modules/payments/application/ports/payment-repository.port';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@packages/shared/payments/payment-method';
import { ensurePersistedEnum } from '@packages/shared/utils/enum.utils';
import { Prisma, PaymentMethod as PrismaPaymentMethod } from '@prisma/client';

type PaymentRecord = {
	id: string;
	orderId: string;
	status: string;
	grossAmount: number;
	boosterAmount: number;
	paymentMethod: PrismaPaymentMethod;
	gateway: string;
	gatewayReferenceId: string | null;
	gatewayId: string | null;
	gatewayStatus: string | null;
	gatewayStatusDetail: string | null;
	gatewayPaymentMethodId: string | null;
	gatewayPaymentTypeId: string | null;
	checkoutUrl: string | null;
	createdAt: Date;
};

function mapDomainPaymentMethodToPersisted(
	paymentMethod: PaymentMethod,
): PrismaPaymentMethod {
	switch (paymentMethod) {
		case PaymentMethod.CREDIT_CARD:
			return PrismaPaymentMethod.CREDIT_CARD;
		case PaymentMethod.PIX:
			return PrismaPaymentMethod.PIX;
		case PaymentMethod.BOLETO:
			return PrismaPaymentMethod.BOLETO;
	}
}

function mapPersistedPaymentMethodToDomain(
	value: PrismaPaymentMethod,
): PaymentMethod {
	switch (value) {
		case PrismaPaymentMethod.CREDIT_CARD:
			return PaymentMethod.CREDIT_CARD;
		case PrismaPaymentMethod.PIX:
			return PaymentMethod.PIX;
		case PrismaPaymentMethod.BOLETO:
			return PaymentMethod.BOLETO;
		default:
			throw new Error(`Invalid payment method persisted: ${value}`);
	}
}

type PaymentDelegate = {
	findUnique(args: { where: { id: string } }): Promise<PaymentRecord | null>;
	findFirst(args: {
		where:
			| { orderId: string }
			| { gatewayId: string }
			| {
					id: string;
					order: { clientId: string };
			  }
			| {
					orderId: string;
					order: { clientId: string };
			  };
	}): Promise<PaymentRecord | null>;
	findMany(args: {
		where: {
			status: string;
			createdAt: { lt: Date };
			order: { status: string };
		};
		orderBy: { createdAt: 'asc' };
		take: number;
	}): Promise<PaymentRecord[]>;
	upsert(args: {
		where: { id: string };
		create: Omit<PaymentRecord, 'createdAt'>;
		update: Omit<PaymentRecord, 'id' | 'orderId' | 'createdAt'>;
	}): Promise<PaymentRecord>;
};

type PaymentPrismaClient = {
	payment: PaymentDelegate;
	$transaction<T>(
		callback: (transaction: {
			$queryRaw<TQuery = unknown>(query: Prisma.Sql): Promise<TQuery>;
		}) => Promise<T>,
		options?: { timeout?: number },
	): Promise<T>;
};

const STALE_CHECKOUT_RECONCILIATION_LOCK_ID = 911_984_301;

@Injectable()
export class PrismaPaymentRepository implements PaymentRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async findById(id: string): Promise<Payment | null> {
		const record = await this.getDelegate().findUnique({ where: { id } });
		if (!record) return null;

		return this.mapRecordToDomain(record);
	}

	async findByIdForClient(
		id: string,
		clientId: string,
	): Promise<Payment | null> {
		const record = await this.getDelegate().findFirst({
			where: {
				id,
				order: { clientId },
			},
		});
		if (!record) return null;

		return this.mapRecordToDomain(record);
	}

	async findByOrderId(orderId: string): Promise<Payment | null> {
		const record = await this.getDelegate().findFirst({ where: { orderId } });
		if (!record) return null;

		return this.mapRecordToDomain(record);
	}

	async findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<Payment | null> {
		const record = await this.getDelegate().findFirst({
			where: {
				orderId,
				order: { clientId },
			},
		});
		if (!record) return null;

		return this.mapRecordToDomain(record);
	}

	async findByGatewayId(gatewayId: string): Promise<Payment | null> {
		const record = await this.getDelegate().findFirst({
			where: { gatewayId },
		});
		if (!record) return null;

		return this.mapRecordToDomain(record);
	}

	async findStaleAwaitingCheckoutCandidates(input: {
		createdBefore: Date;
		limit: number;
	}): Promise<StalePaymentReconciliationCandidate[]> {
		const records = await this.getDelegate().findMany({
			where: {
				status: PaymentStatus.AWAITING_CONFIRMATION,
				createdAt: { lt: input.createdBefore },
				order: { status: 'awaiting_payment' },
			},
			orderBy: { createdAt: 'asc' },
			take: input.limit,
		});

		return records.map((record) => ({
			payment: this.mapRecordToDomain(record),
			createdAt: record.createdAt,
		}));
	}

	async withStaleCheckoutReconciliationLock<T>(
		callback: () => Promise<T>,
	): Promise<T | null> {
		return await this.getClient().$transaction(
			async (transaction) => {
				const [{ locked }] = await transaction.$queryRaw<
					Array<{ locked: boolean }>
				>(
					Prisma.sql`SELECT pg_try_advisory_xact_lock(${STALE_CHECKOUT_RECONCILIATION_LOCK_ID}) AS locked`,
				);
				if (!locked) return null;

				return await callback();
			},
			{ timeout: 120_000 },
		);
	}

	async save(payment: Payment): Promise<void> {
		await this.getDelegate().upsert({
			where: { id: payment.id },
			create: {
				id: payment.id,
				orderId: payment.orderId,
				status: payment.status,
				grossAmount: payment.grossAmount,
				boosterAmount: payment.boosterAmount,
				paymentMethod: mapDomainPaymentMethodToPersisted(payment.paymentMethod),
				gateway: payment.gateway,
				gatewayReferenceId: payment.gatewayReferenceId,
				gatewayId: payment.gatewayId,
				gatewayStatus: payment.gatewayStatus,
				gatewayStatusDetail: payment.gatewayStatusDetail,
				gatewayPaymentMethodId: payment.gatewayPaymentMethodId,
				gatewayPaymentTypeId: payment.gatewayPaymentTypeId,
				checkoutUrl: payment.checkoutUrl,
			},
			update: {
				status: payment.status,
				grossAmount: payment.grossAmount,
				boosterAmount: payment.boosterAmount,
				paymentMethod: mapDomainPaymentMethodToPersisted(payment.paymentMethod),
				gateway: payment.gateway,
				gatewayReferenceId: payment.gatewayReferenceId,
				gatewayId: payment.gatewayId,
				gatewayStatus: payment.gatewayStatus,
				gatewayStatusDetail: payment.gatewayStatusDetail,
				gatewayPaymentMethodId: payment.gatewayPaymentMethodId,
				gatewayPaymentTypeId: payment.gatewayPaymentTypeId,
				checkoutUrl: payment.checkoutUrl,
			},
		});
	}

	private mapRecordToDomain(record: PaymentRecord): Payment {
		return Payment.rehydrate({
			id: record.id,
			orderId: record.orderId,
			status: ensurePersistedEnum(
				PaymentStatus,
				record.status,
				'payment status',
			),
			paymentMethod: mapPersistedPaymentMethodToDomain(record.paymentMethod),
			gateway: this.mapPersistedGateway(record.gateway),
			gatewayReferenceId: record.gatewayReferenceId,
			gatewayId: record.gatewayId,
			gatewayStatus: record.gatewayStatus,
			gatewayStatusDetail: record.gatewayStatusDetail,
			gatewayPaymentMethodId: record.gatewayPaymentMethodId,
			gatewayPaymentTypeId: record.gatewayPaymentTypeId,
			checkoutUrl: record.checkoutUrl,
			grossAmount: record.grossAmount,
			boosterAmount: record.boosterAmount,
		});
	}

	private mapPersistedGateway(value: string): 'MERCADO_PAGO' {
		if (value === 'MERCADO_PAGO') return value;

		throw new Error(`Invalid payment gateway persisted: ${value}`);
	}

	private getDelegate(): PaymentDelegate {
		return this.getClient().payment;
	}

	private getClient(): PaymentPrismaClient {
		return this.prisma as unknown as PaymentPrismaClient;
	}
}
