import { PrismaService } from '@app/common/prisma/prisma.service';
import type { OrderPaymentAmountPort } from '@modules/payments/application/ports/order-payment-amount.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderPaymentAmountFromPrismaAdapter
	implements OrderPaymentAmountPort
{
	constructor(private readonly prisma: PrismaService) {}

	async findByOrderIdForClient(
		orderId: string,
		clientId: string,
	): Promise<number | null> {
		const order = await this.prisma.order.findFirst({
			where: { id: orderId, clientId },
			select: { totalAmount: true },
		});
		if (!order || order.totalAmount === null) return null;

		return order.totalAmount;
	}
}
