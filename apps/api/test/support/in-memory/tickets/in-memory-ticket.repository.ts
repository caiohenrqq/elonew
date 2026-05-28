import type {
	TicketDetailRecord,
	TicketRepositoryPort,
	TicketSummaryRecord,
} from '@modules/tickets/application/ports/ticket-repository.port';
import {
	type Ticket,
	TicketStatus,
} from '@modules/tickets/domain/ticket.entity';
import type { Role } from '@packages/auth/roles/role';

export class InMemoryTicketRepository implements TicketRepositoryPort {
	private readonly tickets = new Map<string, TicketDetailRecord>();
	private readonly clientOrderOwners = new Map<string, string>();

	setClientOrderOwner(orderId: string, clientId: string): void {
		this.clientOrderOwners.set(orderId, clientId);
	}

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
	}): Promise<TicketDetailRecord> {
		const ticketId = `ticket-${this.tickets.size + 1}`;
		const ticket: TicketDetailRecord = {
			id: ticketId,
			userId: input.userId,
			orderId: input.orderId,
			subject: input.subject,
			status: TicketStatus.WAITING_SUPPORT,
			createdAt: input.now,
			updatedAt: input.now,
			messages: [
				{
					id: `${ticketId}-message-1`,
					ticketId,
					senderId: input.userId,
					senderRole: input.userRole,
					content: input.content,
					createdAt: input.now,
				},
			],
		};
		this.tickets.set(ticketId, ticket);

		return this.cloneDetail(ticket);
	}

	async listForUser(input: {
		userId: string;
		limit: number;
	}): Promise<TicketSummaryRecord[]> {
		return this.listTickets({ userId: input.userId, limit: input.limit });
	}

	async listForAdmin(input: {
		limit: number;
		status?: TicketStatus;
		query?: string;
	}): Promise<TicketSummaryRecord[]> {
		return this.listTickets({
			limit: input.limit,
			status: input.status,
			query: input.query,
		});
	}

	async findById(ticketId: string): Promise<TicketDetailRecord | null> {
		const ticket = this.tickets.get(ticketId);

		return ticket ? this.cloneDetail(ticket) : null;
	}

	async addMessage(input: {
		ticket: Ticket;
		senderId: string;
		senderRole: Role;
		content: string;
		now: Date;
	}): Promise<TicketDetailRecord> {
		const stored = this.tickets.get(input.ticket.id);
		if (!stored) throw new Error('Ticket not found in test repository.');

		const next: TicketDetailRecord = {
			...stored,
			status: input.ticket.status,
			updatedAt: input.ticket.updatedAt,
			messages: [
				...stored.messages,
				{
					id: `${input.ticket.id}-message-${stored.messages.length + 1}`,
					ticketId: input.ticket.id,
					senderId: input.senderId,
					senderRole: input.senderRole,
					content: input.content,
					createdAt: input.now,
				},
			],
		};
		this.tickets.set(next.id, next);

		return this.cloneDetail(next);
	}

	async updateStatus(input: {
		ticket: Ticket;
		status: TicketStatus;
		now: Date;
	}): Promise<TicketDetailRecord> {
		const stored = this.tickets.get(input.ticket.id);
		if (!stored) throw new Error('Ticket not found in test repository.');

		const next: TicketDetailRecord = {
			...stored,
			status: input.status,
			updatedAt: input.now,
		};
		this.tickets.set(next.id, next);

		return this.cloneDetail(next);
	}

	private listTickets(input: {
		userId?: string;
		limit: number;
		status?: TicketStatus;
		query?: string;
	}): TicketSummaryRecord[] {
		const query = input.query?.toLowerCase();

		return Array.from(this.tickets.values())
			.filter((ticket) => !input.userId || ticket.userId === input.userId)
			.filter((ticket) => !input.status || ticket.status === input.status)
			.filter(
				(ticket) =>
					!query ||
					ticket.subject.toLowerCase().includes(query) ||
					ticket.userId.toLowerCase().includes(query),
			)
			.sort(
				(left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
			)
			.slice(0, input.limit)
			.map((ticket) => ({
				id: ticket.id,
				userId: ticket.userId,
				orderId: ticket.orderId,
				subject: ticket.subject,
				status: ticket.status,
				createdAt: ticket.createdAt,
				updatedAt: ticket.updatedAt,
				messageCount: ticket.messages.length,
				latestMessageAt:
					ticket.messages[ticket.messages.length - 1]?.createdAt ?? null,
			}));
	}

	private cloneDetail(ticket: TicketDetailRecord): TicketDetailRecord {
		return {
			...ticket,
			messages: ticket.messages.map((message) => ({ ...message })),
		};
	}
}
