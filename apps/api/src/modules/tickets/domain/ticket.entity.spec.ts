import { Role } from '@packages/auth/roles/role';
import { Ticket, TicketStatus } from './ticket.entity';
import { TicketAccessDeniedError } from './ticket.errors';

describe('Ticket', () => {
	it('starts user-created tickets waiting for support', () => {
		const ticket = Ticket.create({
			id: 'ticket-1',
			userId: 'client-1',
			subject: 'Payment question',
			orderId: 'order-1',
			now: new Date('2026-05-28T10:00:00.000Z'),
		});

		expect(ticket.status).toBe(TicketStatus.WAITING_SUPPORT);
		expect(ticket.orderId).toBe('order-1');
	});

	it('moves to waiting for user after an admin reply', () => {
		const ticket = Ticket.rehydrate({
			id: 'ticket-1',
			userId: 'client-1',
			orderId: null,
			subject: 'Payment question',
			status: TicketStatus.WAITING_SUPPORT,
			createdAt: new Date('2026-05-28T10:00:00.000Z'),
			updatedAt: new Date('2026-05-28T10:00:00.000Z'),
		});

		ticket.recordReply({
			senderId: 'admin-1',
			senderRole: Role.ADMIN,
			now: new Date('2026-05-28T10:05:00.000Z'),
		});

		expect(ticket.status).toBe(TicketStatus.WAITING_USER);
	});

	it('reopens closed tickets when the owner replies', () => {
		const ticket = Ticket.rehydrate({
			id: 'ticket-1',
			userId: 'client-1',
			orderId: null,
			subject: 'Payment question',
			status: TicketStatus.CLOSED,
			createdAt: new Date('2026-05-28T10:00:00.000Z'),
			updatedAt: new Date('2026-05-28T10:00:00.000Z'),
		});

		ticket.recordReply({
			senderId: 'client-1',
			senderRole: Role.CLIENT,
			now: new Date('2026-05-28T10:05:00.000Z'),
		});

		expect(ticket.status).toBe(TicketStatus.WAITING_SUPPORT);
	});

	it('rejects replies from unrelated users', () => {
		const ticket = Ticket.rehydrate({
			id: 'ticket-1',
			userId: 'client-1',
			orderId: null,
			subject: 'Payment question',
			status: TicketStatus.WAITING_SUPPORT,
			createdAt: new Date('2026-05-28T10:00:00.000Z'),
			updatedAt: new Date('2026-05-28T10:00:00.000Z'),
		});

		expect(() =>
			ticket.recordReply({
				senderId: 'client-2',
				senderRole: Role.CLIENT,
				now: new Date('2026-05-28T10:05:00.000Z'),
			}),
		).toThrow(TicketAccessDeniedError);
	});
});
