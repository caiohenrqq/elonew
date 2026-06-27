import { PrismaService } from '@app/common/prisma/prisma.service';
import type {
	CouponEventInput,
	CouponEventRecorderPort,
} from '@modules/orders/application/ports/coupon-event-recorder.port';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaCouponEventRecorder implements CouponEventRecorderPort {
	constructor(
		private readonly prisma: PrismaService,
		private readonly logger: PinoLogger,
	) {
		this.logger.setContext(PrismaCouponEventRecorder.name);
	}

	async record(event: CouponEventInput): Promise<void> {
		try {
			await this.prisma.couponEvent.create({
				data: {
					type: event.type,
					code: event.code,
					couponId: event.couponId ?? null,
					clientId: event.clientId ?? null,
					orderId: event.orderId ?? null,
					reason: event.reason ?? null,
				},
			});
		} catch (error) {
			this.logger.error({
				event: 'coupon.event_record',
				outcome: 'error',
				coupon_event_type: event.type,
				coupon_id: event.couponId ?? null,
				error_type:
					error instanceof Error ? error.constructor.name : typeof error,
				error_message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
