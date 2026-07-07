import {
	EMAIL_SENDER_KEY,
	type EmailSenderPort,
} from '@app/common/email/ports/email-sender.port';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	buildOrderBoosterAssignedEmail,
	buildOrderPaidEmail,
} from '@modules/orders/application/emails/build-order-lifecycle-emails';
import {
	ORDER_CLIENT_READER_KEY,
	type OrderClientReaderPort,
} from '@modules/orders/application/ports/order-client-reader.port';
import type { Order } from '@modules/orders/domain/order.entity';
import { Inject, Injectable, Logger } from '@nestjs/common';

const emailBuilders = {
	paid: buildOrderPaidEmail,
	booster_assigned: buildOrderBoosterAssignedEmail,
};

type OrderLifecycleEmailKind = keyof typeof emailBuilders;

@Injectable()
export class OrderLifecycleEmailService {
	private readonly logger = new Logger(OrderLifecycleEmailService.name);

	constructor(
		@Inject(ORDER_CLIENT_READER_KEY)
		private readonly orderClientReader: OrderClientReaderPort,
		@Inject(EMAIL_SENDER_KEY)
		private readonly emailSender: EmailSenderPort,
		private readonly appSettings: AppSettingsService,
	) {}

	async sendOrderPaidEmail(order: Order): Promise<void> {
		await this.send('paid', order);
	}

	async sendBoosterAssignedEmail(order: Order): Promise<void> {
		await this.send('booster_assigned', order);
	}

	private async send(
		kind: OrderLifecycleEmailKind,
		order: Order,
	): Promise<void> {
		try {
			if (!order.clientId) return;
			const to = await this.orderClientReader.findEmailById(order.clientId);
			if (!to) return;

			const email = emailBuilders[kind]({
				orderId: order.id,
				orderUrl: this.buildOrderUrl(order.id),
				route: formatOrderRoute(order),
			});
			await this.emailSender.send({ to, ...email });
		} catch (error) {
			this.logger.warn(
				`Failed to send order ${kind} email for order ${order.id}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	private buildOrderUrl(orderId: string) {
		return new URL(
			`/client/orders/${orderId}`,
			this.appSettings.webAppUrl,
		).toString();
	}
}

const formatOrderRoute = (order: Order): string | null => {
	const details = order.requestDetails;
	if (!details) return null;

	return `${formatTitleCase(details.currentLeague)} ${details.currentDivision} → ${formatTitleCase(details.desiredLeague)} ${details.desiredDivision}`;
};

const formatTitleCase = (value: string) =>
	value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
