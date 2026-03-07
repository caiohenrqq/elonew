import { MarkOrderAsPaidUseCase } from '@modules/orders/application/use-cases/mark-order-as-paid/mark-order-as-paid.use-case';
import type { OrderPaymentConfirmationPort } from '@modules/payments/application/ports/order-payment-confirmation.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderPaymentConfirmationFromOrdersAdapter
	implements OrderPaymentConfirmationPort
{
	constructor(
		private readonly markOrderAsPaidUseCase: MarkOrderAsPaidUseCase,
	) {}

	async markAsPaid(orderId: string): Promise<void> {
		await this.markOrderAsPaidUseCase.execute({ orderId });
	}
}
