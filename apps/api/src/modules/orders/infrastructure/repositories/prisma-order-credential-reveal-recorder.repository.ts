import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	OrderCredentialRevealInput,
	OrderCredentialRevealRecorderPort,
} from '@modules/orders/application/ports/order-credential-reveal-recorder.port';
import { Injectable } from '@nestjs/common';

// Unlike PrismaCouponEventRecorder, failures are not swallowed: the caller must
// be able to withhold the credentials when the reveal cannot be audited.
@Injectable()
export class PrismaOrderCredentialRevealRecorder
	implements OrderCredentialRevealRecorderPort
{
	constructor(private readonly prisma: PrismaService) {}

	async record(reveal: OrderCredentialRevealInput): Promise<void> {
		await this.prisma.orderCredentialReveal.create({
			data: {
				orderId: reveal.orderId,
				boosterId: reveal.boosterId,
			},
		});
	}
}
