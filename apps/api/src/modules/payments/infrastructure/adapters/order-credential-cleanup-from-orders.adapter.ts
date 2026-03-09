import { ClearOrderCredentialsUseCase } from '@modules/orders/application/use-cases/clear-order-credentials/clear-order-credentials.use-case';
import type { OrderCredentialCleanupPort } from '@modules/payments/application/ports/order-credential-cleanup.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderCredentialCleanupFromOrdersAdapter
	implements OrderCredentialCleanupPort
{
	constructor(
		private readonly clearOrderCredentialsUseCase: ClearOrderCredentialsUseCase,
	) {}

	async clearCredentials(orderId: string): Promise<void> {
		await this.clearOrderCredentialsUseCase.execute({ orderId });
	}
}
