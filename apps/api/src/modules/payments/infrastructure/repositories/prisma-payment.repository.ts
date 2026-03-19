import { PrismaService } from '@app/common/prisma/prisma.service';
import type { PaymentRepositoryPort } from '@modules/payments/application/ports/payment-repository.port';
import { Payment } from '@modules/payments/domain/payment.entity';
import { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Injectable } from '@nestjs/common';
import { ensurePersistedEnum } from '@shared/utils/enum.utils';

type PaymentRecord = {
	id: string;
	orderId: string;
	status: string;
	grossAmount: number;
	boosterAmount: number;
};

type PaymentDelegate = {
	findUnique(args: { where: { id: string } }): Promise<PaymentRecord | null>;
	findFirst(args: {
		where:
			| { orderId: string }
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

	async save(payment: Payment): Promise<void> {
		await this.getDelegate().upsert({
			where: { id: payment.id },
			create: {
				id: payment.id,
				orderId: payment.orderId,
				status: payment.status,
				grossAmount: payment.grossAmount,
				boosterAmount: payment.boosterAmount,
			},
			update: {
				status: payment.status,
				grossAmount: payment.grossAmount,
				boosterAmount: payment.boosterAmount,
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
			grossAmount: record.grossAmount,
			boosterAmount: record.boosterAmount,
		});
	}

	private getDelegate(): PaymentDelegate {
		return (this.prisma as unknown as PaymentPrismaClient).payment;
	}
}
