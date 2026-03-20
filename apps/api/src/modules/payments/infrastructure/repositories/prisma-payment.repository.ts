import { PrismaService } from '@app/common/prisma/prisma.service';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Injectable } from '@nestjs/common';
import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client';
import { PaymentMethod } from '@shared/payments/payment-method';
import { ensurePersistedEnum } from '@shared/utils/enum.utils';

type PaymentRecord = {
	id: string;
	orderId: string;
	status: string;
	grossAmount: number;
	boosterAmount: number;
	paymentMethod: PrismaPaymentMethod;
	gateway: string;
	gatewayId: string | null;
	gatewayStatus: string | null;
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
			  };
	}): Promise<PaymentRecord | null>;
	upsert(args: {
		where: { id: string };
		create: PaymentRecord;
		update: Omit<PaymentRecord, 'id' | 'orderId'>;
	}): Promise<PaymentRecord>;
};

type PaymentPrismaClient = {
	payment: PaymentDelegate;
};

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

	async findByGatewayId(gatewayId: string): Promise<Payment | null> {
		const record = await this.getDelegate().findFirst({
			where: { gatewayId },
		});
		if (!record) return null;

		return this.mapRecordToDomain(record);
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
				gatewayId: payment.gatewayId,
				gatewayStatus: payment.gatewayStatus,
			},
			update: {
				status: payment.status,
				grossAmount: payment.grossAmount,
				boosterAmount: payment.boosterAmount,
				paymentMethod: mapDomainPaymentMethodToPersisted(payment.paymentMethod),
				gateway: payment.gateway,
				gatewayId: payment.gatewayId,
				gatewayStatus: payment.gatewayStatus,
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
			gatewayId: record.gatewayId,
			gatewayStatus: record.gatewayStatus,
			grossAmount: record.grossAmount,
			boosterAmount: record.boosterAmount,
		});
	}

	private mapPersistedGateway(value: string): 'MERCADO_PAGO' {
		if (value === 'MERCADO_PAGO') return value;

		throw new Error(`Invalid payment gateway persisted: ${value}`);
	}

	private getDelegate(): PaymentDelegate {
		return (this.prisma as unknown as PaymentPrismaClient).payment;
	}
}
