import { PrismaService } from '@app/common/prisma/prisma.service';
import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderStatusPort } from '@modules/payments/application/ports/order-status.port';
import { Injectable } from '@nestjs/common';
import { ensurePersistedEnum } from '@shared/utils/enum.utils';

type OrderRecord = {
	status: string;
};

type OrderDelegate = {
	findUnique(args: {
		where: { id: string };
		select: { status: true };
	}): Promise<OrderRecord | null>;
};

type OrderStatusPrismaClient = {
	order: OrderDelegate;
};

@Injectable()
export class OrderStatusFromPrismaAdapter implements OrderStatusPort {
	constructor(private readonly prisma: PrismaService) {}

	async findByOrderId(orderId: string): Promise<OrderStatus | null> {
		const record = await this.getDelegate().findUnique({
			where: { id: orderId },
			select: { status: true },
		});
		if (!record) return null;

		return ensurePersistedEnum(OrderStatus, record.status, 'order status');
	}

	private getDelegate(): OrderDelegate {
		return (this.prisma as unknown as OrderStatusPrismaClient).order;
	}
}
