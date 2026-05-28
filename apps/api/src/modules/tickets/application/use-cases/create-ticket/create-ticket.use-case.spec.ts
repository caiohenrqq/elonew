import {
	TICKET_REPOSITORY_KEY,
	type TicketRepositoryPort,
} from '@modules/tickets/application/ports/ticket-repository.port';
import { CreateTicketUseCase } from '@modules/tickets/application/use-cases/create-ticket/create-ticket.use-case';
import { TicketStatus } from '@modules/tickets/domain/ticket.entity';
import {
	TicketOrderAccessDeniedError,
	TicketOrderLinkUnsupportedError,
} from '@modules/tickets/domain/ticket.errors';
import { Test } from '@nestjs/testing';
import { Role } from '@packages/auth/roles/role';

class TicketRepositoryStub implements TicketRepositoryPort {
	public clientOrderOwners = new Map<string, string>();
	public createdTickets: Array<{
		id: string;
		userId: string;
		orderId: string | null;
		subject: string;
		status: TicketStatus;
		message: {
			senderId: string;
			content: string;
		};
	}> = [];

	async isClientOrderOwner(input: {
		orderId: string;
		clientId: string;
	}): Promise<boolean> {
		return this.clientOrderOwners.get(input.orderId) === input.clientId;
	}

	async createWithInitialMessage(input: {
		userId: string;
		userRole: Role;
		orderId: string | null;
		subject: string;
		content: string;
		now: Date;
	}) {
		const ticket = {
			id: `ticket-${this.createdTickets.length + 1}`,
			userId: input.userId,
			orderId: input.orderId,
			subject: input.subject,
			status: TicketStatus.WAITING_SUPPORT,
			createdAt: input.now,
			updatedAt: input.now,
			messages: [
				{
					id: 'message-1',
					ticketId: `ticket-${this.createdTickets.length + 1}`,
					senderId: input.userId,
					senderRole: input.userRole,
					content: input.content,
					createdAt: input.now,
				},
			],
		};
		this.createdTickets.push({
			id: ticket.id,
			userId: input.userId,
			orderId: input.orderId,
			subject: input.subject,
			status: ticket.status,
			message: {
				senderId: input.userId,
				content: input.content,
			},
		});

		return ticket;
	}

	listForUser(): never {
		throw new Error('Method not implemented.');
	}

	listForAdmin(): never {
		throw new Error('Method not implemented.');
	}

	findById(): never {
		throw new Error('Method not implemented.');
	}

	addMessage(): never {
		throw new Error('Method not implemented.');
	}

	updateStatus(): never {
		throw new Error('Method not implemented.');
	}
}

describe('CreateTicketUseCase', () => {
	let repository: TicketRepositoryStub;
	let useCase: CreateTicketUseCase;

	beforeEach(async () => {
		repository = new TicketRepositoryStub();
		const moduleRef = await Test.createTestingModule({
			providers: [
				CreateTicketUseCase,
				{
					provide: TICKET_REPOSITORY_KEY,
					useValue: repository,
				},
			],
		}).compile();

		useCase = moduleRef.get(CreateTicketUseCase);
	});

	it('creates a general ticket waiting for support', async () => {
		const result = await useCase.execute({
			userId: 'client-1',
			role: Role.CLIENT,
			subject: 'Payment question',
			content: 'Can you check this?',
			now: new Date('2026-05-28T10:00:00.000Z'),
		});

		expect(result.status).toBe(TicketStatus.WAITING_SUPPORT);
		expect(result.orderId).toBeNull();
		expect(repository.createdTickets).toEqual([
			expect.objectContaining({
				userId: 'client-1',
				orderId: null,
				subject: 'Payment question',
				status: TicketStatus.WAITING_SUPPORT,
			}),
		]);
	});

	it('creates booster general tickets with the booster sender role', async () => {
		const result = await useCase.execute({
			userId: 'booster-1',
			role: Role.BOOSTER,
			subject: 'Account question',
			content: 'Can support check this?',
			now: new Date('2026-05-28T10:00:00.000Z'),
		});

		expect(result.messages[0]).toEqual(
			expect.objectContaining({
				senderId: 'booster-1',
				senderRole: Role.BOOSTER,
			}),
		);
	});

	it('allows clients to link tickets to their own orders', async () => {
		repository.clientOrderOwners.set('order-1', 'client-1');

		const result = await useCase.execute({
			userId: 'client-1',
			role: Role.CLIENT,
			subject: 'Order question',
			content: 'Can you check this order?',
			orderId: 'order-1',
			now: new Date('2026-05-28T10:00:00.000Z'),
		});

		expect(result.orderId).toBe('order-1');
	});

	it('rejects booster order-linked tickets', async () => {
		await expect(
			useCase.execute({
				userId: 'booster-1',
				role: Role.BOOSTER,
				subject: 'Order question',
				content: 'Can you check this order?',
				orderId: 'order-1',
				now: new Date('2026-05-28T10:00:00.000Z'),
			}),
		).rejects.toBeInstanceOf(TicketOrderLinkUnsupportedError);
	});

	it('rejects non-owned client order links', async () => {
		repository.clientOrderOwners.set('order-1', 'client-2');

		await expect(
			useCase.execute({
				userId: 'client-1',
				role: Role.CLIENT,
				subject: 'Order question',
				content: 'Can you check this order?',
				orderId: 'order-1',
				now: new Date('2026-05-28T10:00:00.000Z'),
			}),
		).rejects.toBeInstanceOf(TicketOrderAccessDeniedError);
	});
});
