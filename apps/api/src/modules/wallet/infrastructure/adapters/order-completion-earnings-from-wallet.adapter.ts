import { PrismaService } from '@app/common/prisma/prisma.service';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { OrderCompletionEarningsPort } from '@modules/orders/application/ports/order-completion-earnings.port';
import { CreditCompletedOrderEarningsUseCase } from '@modules/wallet/application/use-cases/credit-completed-order-earnings/credit-completed-order-earnings.use-case';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderCompletionEarningsFromWalletAdapter
	implements OrderCompletionEarningsPort
{
	constructor(
		private readonly prisma: PrismaService,
		private readonly creditCompletedOrderEarningsUseCase: CreditCompletedOrderEarningsUseCase,
		private readonly appSettings: AppSettingsService,
	) {}

	async creditCompletedOrderEarnings(input: {
		orderId: string;
		boosterId: string;
		completedAt: Date;
	}): Promise<void> {
		const payment = await this.prisma.payment.findFirst({
			where: { orderId: input.orderId },
		});
		if (!payment) return;

		await this.creditCompletedOrderEarningsUseCase.execute({
			orderId: input.orderId,
			boosterId: input.boosterId,
			amount: payment.boosterAmount,
			completedAt: input.completedAt,
			lockPeriodInHours: this.appSettings.walletLockPeriodInHours,
		});
	}
}
