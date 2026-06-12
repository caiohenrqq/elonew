import { OutboxDispatcherService } from '@app/common/outbox/outbox-dispatcher.service';
import { OutboxHandlerRegistry } from '@app/common/outbox/outbox-event-handler';
import { PrismaService } from '@app/common/prisma/prisma.service';
import { SendChatMessageUseCase } from '@modules/chat/application/use-cases/send-chat-message/send-chat-message.use-case';
import { ChatModule } from '@modules/chat/chat.module';
import type { NotificationEventsPort } from '@modules/notifications/application/ports/notification-events.port';
import { NOTIFICATION_EVENTS_KEY } from '@modules/notifications/application/ports/notification-events.port';
import { NotificationOutboxHandler } from '@modules/notifications/infrastructure/outbox/notification-outbox.handler';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';

class NotificationEventsSpy implements NotificationEventsPort {
	readonly updated: Array<{ recipientId: string; unreadCount: number }> = [];
	readonly readAll: Array<{ recipientId: string }> = [];

	emitNotificationUpdated(
		recipientId: string,
		event: { unreadCount: number },
	): void {
		this.updated.push({ recipientId, unreadCount: event.unreadCount });
	}

	emitNotificationsReadAll(recipientId: string): void {
		this.readAll.push({ recipientId });
	}
}

describe('Transactional outbox integration (db)', () => {
	let moduleRef: TestingModule;
	let prisma: PrismaService;
	let sendChatMessage: SendChatMessageUseCase;
	let dispatcher: OutboxDispatcherService;
	let events: NotificationEventsSpy;
	let clientId: string;
	let boosterId: string;
	let orderId: string;

	beforeEach(async () => {
		events = new NotificationEventsSpy();
		moduleRef = await Test.createTestingModule({
			imports: [ChatModule],
		})
			.overrideProvider(NOTIFICATION_EVENTS_KEY)
			.useValue(events)
			.compile();

		prisma = moduleRef.get(PrismaService);
		sendChatMessage = moduleRef.get(SendChatMessageUseCase, { strict: false });
		dispatcher = moduleRef.get(OutboxDispatcherService, { strict: false });
		const registry = moduleRef.get(OutboxHandlerRegistry, { strict: false });
		registry.register(
			moduleRef.get(NotificationOutboxHandler, { strict: false }),
		);

		await prisma.outboxEvent.deleteMany();
		await prisma.ticketMessage.deleteMany();
		await prisma.ticket.deleteMany();
		await prisma.processedWebhookEvent.deleteMany();
		await prisma.notification.deleteMany();
		await prisma.chatMessage.deleteMany();
		await prisma.chat.deleteMany();
		await prisma.walletTransaction.deleteMany();
		await prisma.payment.deleteMany();
		await prisma.orderCredentials.deleteMany();
		await prisma.orderQuote.deleteMany();
		await prisma.order.deleteMany();
		await prisma.authSession.deleteMany();
		await prisma.wallet.deleteMany();
		await prisma.user.deleteMany();

		const client = await prisma.user.create({
			data: {
				username: 'outbox-client',
				email: 'outbox-client@example.com',
				password: 'secret',
				role: 'CLIENT',
			},
		});
		const booster = await prisma.user.create({
			data: {
				username: 'outbox-booster',
				email: 'outbox-booster@example.com',
				password: 'secret',
				role: 'BOOSTER',
			},
		});
		clientId = client.id;
		boosterId = booster.id;
		const order = await prisma.order.create({
			data: {
				clientId,
				boosterId,
				status: 'in_progress',
			},
		});
		orderId = order.id;
		await prisma.chat.create({ data: { orderId } });
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	const sendClientMessage = () =>
		sendChatMessage.execute({
			orderId,
			userId: clientId,
			role: Role.CLIENT,
			content: 'Olá booster',
		});

	it('writes a pending outbox event in the same transaction as the chat message and notification', async () => {
		await sendClientMessage();

		const messages = await prisma.chatMessage.findMany();
		const notifications = await prisma.notification.findMany();
		const outboxEvents = await prisma.outboxEvent.findMany();

		expect(messages).toHaveLength(1);
		expect(notifications).toHaveLength(1);
		expect(outboxEvents).toHaveLength(1);
		expect(outboxEvents[0]).toMatchObject({
			eventType: 'notification.updated',
			aggregateId: boosterId,
			status: 'PENDING',
			publishedAt: null,
		});
		expect(outboxEvents[0]?.payload).toMatchObject({
			recipientId: boosterId,
			event: { unreadCount: 1 },
		});
		// No dispatcher run yet: the event survives, undelivered.
		expect(events.updated).toEqual([]);
	});

	it('publishes a pending event and marks it published when the dispatcher runs', async () => {
		await sendClientMessage();

		await dispatcher.processPendingBatch();

		expect(events.updated).toEqual([
			{ recipientId: boosterId, unreadCount: 1 },
		]);
		const outboxEvents = await prisma.outboxEvent.findMany();
		expect(outboxEvents[0]?.status).toBe('PUBLISHED');
		expect(outboxEvents[0]?.publishedAt).not.toBeNull();
	});

	it('does not re-publish an already published event (at-least-once, idempotent)', async () => {
		await sendClientMessage();

		await dispatcher.processPendingBatch();
		await dispatcher.processPendingBatch();

		expect(events.updated).toHaveLength(1);
		const outboxEvents = await prisma.outboxEvent.findMany();
		expect(outboxEvents).toHaveLength(1);
		expect(outboxEvents[0]?.status).toBe('PUBLISHED');
	});

	it('marks an event failed when no handler is registered for its type', async () => {
		await prisma.outboxEvent.create({
			data: {
				aggregateType: 'notification',
				aggregateId: clientId,
				eventType: 'unknown.event',
				payload: { recipientId: clientId },
			},
		});

		await dispatcher.processPendingBatch();

		const failed = await prisma.outboxEvent.findFirst({
			where: { eventType: 'unknown.event' },
		});
		expect(failed?.status).toBe('FAILED');
		expect(failed?.attempts).toBe(1);
		expect(failed?.lastError).toContain('No handler');
	});
});
