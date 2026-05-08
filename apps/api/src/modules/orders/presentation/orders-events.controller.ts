import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import type { OrderEvent } from '@modules/orders/application/ports/order-event-publisher.port';
import { InMemoryOrderEventBus } from '@modules/orders/infrastructure/events/in-memory-order-event-bus';
import { Controller, type MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import { Observable } from 'rxjs';

const HEARTBEAT_INTERVAL_MS = 25_000;

type OrderEventMessage = Pick<
	OrderEvent,
	'id' | 'type' | 'orderId' | 'occurredAt'
>;

@Controller('orders/events')
export class OrdersEventsController {
	constructor(private readonly orderEventBus: InMemoryOrderEventBus) {}

	@Sse()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT, Role.BOOSTER)
	stream(
		@CurrentUser() currentUser: AuthenticatedUser,
	): Observable<MessageEvent> {
		return new Observable<MessageEvent>((subscriber) => {
			const unsubscribe = this.orderEventBus.subscribe(
				(event) => {
					if (!this.canReceiveEvent(currentUser, event)) return;

					subscriber.next({
						id: event.id,
						type: event.type,
						data: this.mapOrderEventMessage(event),
					});
				},
				{
					close: () => subscriber.complete(),
					key: `${currentUser.role}:${currentUser.id}`,
				},
			);
			const heartbeat = setInterval(() => {
				subscriber.next({
					type: 'heartbeat',
					data: {},
				});
			}, HEARTBEAT_INTERVAL_MS);

			return () => {
				clearInterval(heartbeat);
				unsubscribe();
			};
		});
	}

	private canReceiveEvent(
		currentUser: AuthenticatedUser,
		event: OrderEvent,
	): boolean {
		if (currentUser.role === Role.CLIENT)
			return event.clientId === currentUser.id;
		if (currentUser.role !== Role.BOOSTER) return false;

		if (event.type === 'order.paid') {
			return event.boosterId === null || event.boosterId === currentUser.id;
		}

		return event.boosterId === currentUser.id;
	}

	private mapOrderEventMessage(event: OrderEvent): OrderEventMessage {
		return {
			id: event.id,
			type: event.type,
			orderId: event.orderId,
			occurredAt: event.occurredAt,
		};
	}
}
