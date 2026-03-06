import { PrismaProcessedWebhookEventRepository } from '@modules/payments/infrastructure/repositories/prisma-processed-webhook-event.repository';

describe('PrismaProcessedWebhookEventRepository', () => {
	it('returns whether an event has already been processed', async () => {
		const prisma = {
			processedWebhookEvent: {
				findUnique: jest
					.fn()
					.mockResolvedValueOnce({ eventId: 'event-1' })
					.mockResolvedValueOnce(null),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaProcessedWebhookEventRepository(
			prisma as never,
		);

		await expect(repository.has('event-1')).resolves.toBe(true);
		await expect(repository.has('event-2')).resolves.toBe(false);
	});

	it('marks an event as processed idempotently', async () => {
		const upsert = jest.fn().mockResolvedValue({ eventId: 'event-3' });
		const prisma = {
			processedWebhookEvent: {
				findUnique: jest.fn(),
				upsert,
			},
		};
		const repository = new PrismaProcessedWebhookEventRepository(
			prisma as never,
		);

		await repository.markProcessed('event-3');
		await repository.markProcessed('event-3');

		expect(upsert).toHaveBeenCalledWith({
			where: { eventId: 'event-3' },
			create: { eventId: 'event-3' },
			update: {},
		});
	});
});
