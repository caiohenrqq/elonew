import { PrismaService } from '@app/common/prisma/prisma.service';
import { OrderStatus } from '@modules/orders/domain/order-status';
import type { OrderStatusPort } from '@modules/payments/application/ports/order-status.port';
import { Injectable } from '@nestjs/common';

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
		if (!Object.values(OrderStatus).includes(record.status as OrderStatus))
			throw new Error(`Invalid order status persisted: ${record.status}`);

		return record.status as OrderStatus;
	}

	private getDelegate(): OrderDelegate {
		return (this.prisma as unknown as OrderStatusPrismaClient).order;
	}
}
