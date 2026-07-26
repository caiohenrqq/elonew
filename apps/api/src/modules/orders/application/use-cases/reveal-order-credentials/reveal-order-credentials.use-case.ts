import {
	type OrderCredentialsAccessLogEvent,
	OrderCredentialsAccessLogger,
} from '@modules/orders/application/logging/order-credentials-access.logger';
import {
	ORDER_CREDENTIAL_REVEAL_RECORDER_KEY,
	type OrderCredentialRevealRecorderPort,
} from '@modules/orders/application/ports/order-credential-reveal-recorder.port';
import {
	ORDER_CREDENTIALS_READER_KEY,
	type OrderCredentialsReaderPort,
} from '@modules/orders/application/ports/order-credentials-reader.port';
import type { OrderCredentials } from '@modules/orders/domain/order.entity';
import {
	OrderCredentialsNotFoundError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import { Inject, Injectable } from '@nestjs/common';

type RevealOrderCredentialsInput = {
	orderId: string;
	boosterId: string;
};

@Injectable()
export class RevealOrderCredentialsUseCase {
	constructor(
		@Inject(ORDER_CREDENTIALS_READER_KEY)
		private readonly credentialsReader: OrderCredentialsReaderPort,
		@Inject(ORDER_CREDENTIAL_REVEAL_RECORDER_KEY)
		private readonly revealRecorder: OrderCredentialRevealRecorderPort,
		private readonly accessLogger: OrderCredentialsAccessLogger,
	) {}

	async execute(input: RevealOrderCredentialsInput): Promise<OrderCredentials> {
		const startedAt = Date.now();
		const event: OrderCredentialsAccessLogEvent = {
			event: 'order.credentials_reveal',
			order_id: input.orderId,
			booster_id: input.boosterId,
		};

		try {
			const order = await this.credentialsReader.findCredentialsForBooster(
				input.orderId,
				input.boosterId,
			);
			if (!order) throw new OrderNotFoundError();
			if (!order.credentials) throw new OrderCredentialsNotFoundError();

			// Recorded before the plaintext leaves the use case, so a reveal that
			// cannot be audited does not happen at all.
			await this.revealRecorder.record({
				orderId: input.orderId,
				boosterId: input.boosterId,
			});

			event.outcome = 'success';
			return order.credentials;
		} catch (error) {
			event.outcome =
				error instanceof OrderNotFoundError ||
				error instanceof OrderCredentialsNotFoundError
					? 'denied'
					: 'error';
			event.error_type =
				error instanceof Error ? error.constructor.name : typeof error;
			throw error;
		} finally {
			this.accessLogger.emit(event, startedAt);
		}
	}
}
