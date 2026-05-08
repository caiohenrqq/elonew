import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import type { OrderEvent } from '@modules/orders/application/ports/order-event-publisher.port';
import { InMemoryOrderEventBus } from '@modules/orders/infrastructure/events/in-memory-order-event-bus';
import { OrdersEventsController } from '@modules/orders/presentation/orders-events.controller';
import { Role } from '@packages/auth/roles/role';
import { firstValueFrom, take, timeout } from 'rxjs';

const makeUser = (id: string, role: Role): AuthenticatedUser => ({
	id,
	role,
});

const makeEvent = (input: Partial<OrderEvent> = {}): OrderEvent => ({
	id: input.id ?? 'event-1',
	type: input.type ?? 'order.paid',
	orderId: input.orderId ?? 'order-1',
	clientId: input.clientId ?? 'client-1',
	boosterId: input.boosterId ?? null,
	occurredAt: input.occurredAt ?? '2026-05-08T12:00:00.000Z',
});

describe('OrdersEventsController', () => {
	it('streams client events only to the owning client', async () => {
		const bus = new InMemoryOrderEventBus();
		const controller = new OrdersEventsController(bus);
		const messagePromise = firstValueFrom(
			controller.stream(makeUser('client-1', Role.CLIENT)).pipe(take(1)),
		);

		await bus.publish(makeEvent({ id: 'other', clientId: 'client-2' }));
		await bus.publish(makeEvent({ id: 'owned', clientId: 'client-1' }));

		await expect(messagePromise).resolves.toMatchObject({
			id: 'owned',
			type: 'order.paid',
			data: {
				id: 'owned',
				orderId: 'order-1',
			},
		});
	});

	it('streams unassigned paid queue events to boosters', async () => {
		const bus = new InMemoryOrderEventBus();
		const controller = new OrdersEventsController(bus);
		const messagePromise = firstValueFrom(
			controller.stream(makeUser('booster-1', Role.BOOSTER)).pipe(take(1)),
		);

		await bus.publish(makeEvent({ boosterId: null }));

		await expect(messagePromise).resolves.toMatchObject({
			type: 'order.paid',
			data: {
				orderId: 'order-1',
			},
		});
	});

	it('does not expose client ids in streamed payloads', async () => {
		const bus = new InMemoryOrderEventBus();
		const controller = new OrdersEventsController(bus);
		const messagePromise = firstValueFrom(
			controller.stream(makeUser('booster-1', Role.BOOSTER)).pipe(take(1)),
		);

		await bus.publish(
			makeEvent({ clientId: 'client-private', boosterId: null }),
		);

		await expect(messagePromise).resolves.toMatchObject({
			data: expect.not.objectContaining({
				clientId: expect.anything(),
			}),
		});
	});

	it('does not stream selected-booster events to unrelated boosters', async () => {
		const bus = new InMemoryOrderEventBus();
		const controller = new OrdersEventsController(bus);
		const messagePromise = firstValueFrom(
			controller
				.stream(makeUser('booster-2', Role.BOOSTER))
				.pipe(take(1), timeout({ first: 25 })),
		);

		await bus.publish(makeEvent({ boosterId: 'booster-1' }));

		await expect(messagePromise).rejects.toThrow();
	});

	it('replaces an existing stream for the same user', async () => {
		const bus = new InMemoryOrderEventBus();
		const controller = new OrdersEventsController(bus);
		const firstMessages: unknown[] = [];
		const firstSubscription = controller
			.stream(makeUser('client-1', Role.CLIENT))
			.subscribe({
				complete: () => firstMessages.push('completed'),
				next: (message) => firstMessages.push(message),
			});
		const secondMessagePromise = firstValueFrom(
			controller.stream(makeUser('client-1', Role.CLIENT)).pipe(take(1)),
		);

		await bus.publish(makeEvent({ clientId: 'client-1' }));

		await expect(secondMessagePromise).resolves.toMatchObject({
			type: 'order.paid',
		});
		expect(firstMessages).toEqual(['completed']);
		firstSubscription.unsubscribe();
	});
});
