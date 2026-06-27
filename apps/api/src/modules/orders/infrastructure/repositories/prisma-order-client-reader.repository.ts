import { PrismaService } from '@app/common/prisma/prisma.service';
import type { OrderClientReaderPort } from '@modules/orders/application/ports/order-client-reader.port';
import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PrismaOrderClientReader implements OrderClientReaderPort {
	constructor(private readonly prisma: PrismaService) {}

	async findEmailById(clientId: string): Promise<string | null> {
		const user = await this.prisma.user.findUnique({
			where: { id: clientId },
			select: { email: true },
		});
		return user?.email ?? null;
	}

	async hasPaidOrder(clientId: string): Promise<boolean> {
		const order = await this.prisma.order.findFirst({
			where: {
				clientId,
				status: {
					in: [
						OrderStatus.pending_booster,
						OrderStatus.in_progress,
						OrderStatus.completed,
					],
				},
			},
			select: { id: true },
		});
		return order !== null;
	}
}
