import { PrismaService } from '@app/common/prisma/prisma.service';
import type { PaymentGovernanceActionPort } from '@modules/payments/application/ports/payment-governance-action.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentGovernanceActionFromPrismaAdapter
	implements PaymentGovernanceActionPort
{
	constructor(private readonly prisma: PrismaService) {}

	async recordLateApprovedAfterExpiration(input: {
		paymentId: string;
		orderId: string;
	}): Promise<void> {
		await this.prisma.adminGovernanceAction.create({
			data: {
				adminUserId: null,
				actionType: 'PAYMENT_LATE_APPROVAL',
				reason: `Mercado Pago approved payment ${input.paymentId} after internal expiration.`,
				targetOrderId: input.orderId,
			},
		});
	}
}
