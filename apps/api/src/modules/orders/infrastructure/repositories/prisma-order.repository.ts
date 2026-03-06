import { PrismaService } from '@app/common/prisma/prisma.service';
import type { OrderRepositoryPort } from '@modules/orders/application/ports/order-repository.port';
import { Order } from '@modules/orders/domain/order.entity';
import { OrderStatus } from '@modules/orders/domain/order-status';
import { Injectable } from '@nestjs/common';
import { ensurePersistedEnum } from '@shared/utils/enum.utils';

type OrderRecord = {
	id: string;
	status: string;
};

type OrderDelegate = {
	findUnique(args: { where: { id: string } }): Promise<OrderRecord | null>;
	upsert(args: {
		where: { id: string };
		create: OrderRecord;
		update: Pick<OrderRecord, 'status'>;
	}): Promise<OrderRecord>;
};

type OrderPrismaClient = {
	order: OrderDelegate;
};

@Injectable()
export class PrismaOrderRepository implements OrderRepositoryPort {
	constructor(private readonly prisma: PrismaService) {}

	async findById(id: string): Promise<Order | null> {
		const record = await this.getDelegate().findUnique({ where: { id } });
		if (!record) return null;

		return Order.rehydrate({
			id: record.id,
			status: ensurePersistedEnum(OrderStatus, record.status, 'order status'),
		});
	}

	async save(order: Order): Promise<void> {
		await this.getDelegate().upsert({
			where: { id: order.id },
			create: {
				id: order.id,
				status: order.status,
			},
			update: {
				status: order.status,
			},
		});
	}

	private getDelegate(): OrderDelegate {
		return (this.prisma as unknown as OrderPrismaClient).order;
	}
}
