import type {
	Ticket,
	TicketMessage,
	TicketStatus,
} from '@modules/tickets/domain/ticket.entity';
import type { Role } from '@packages/auth/roles/role';

export const TICKET_REPOSITORY_KEY = Symbol('TICKET_REPOSITORY_KEY');

export type TicketDetailRecord = {
	id: string;
	userId: string;
	orderId: string | null;
	subject: string;
	status: TicketStatus;
	createdAt: Date;
	updatedAt: Date;
	messages: TicketMessage[];
};

export type TicketSummaryRecord = Omit<TicketDetailRecord, 'messages'> & {
	messageCount: number;
	latestMessageAt: Date | null;
};

export interface TicketRepositoryPort {
	isClientOrderOwner(input: {
		orderId: string;
		clientId: string;
	}): Promise<boolean>;
	createWithInitialMessage(input: {
		userId: string;
		userRole: Role;
		orderId: string | null;
		subject: string;
		content: string;
		now: Date;
	}): Promise<TicketDetailRecord>;
	listForUser(input: {
		userId: string;
		limit: number;
	}): Promise<TicketSummaryRecord[]>;
	listForAdmin(input: {
		limit: number;
		status?: TicketStatus;
		query?: string;
	}): Promise<TicketSummaryRecord[]>;
	findById(ticketId: string): Promise<TicketDetailRecord | null>;
	addMessage(input: {
		ticket: Ticket;
		senderId: string;
		senderRole: Role;
		content: string;
		now: Date;
	}): Promise<TicketDetailRecord>;
	updateStatus(input: {
		ticket: Ticket;
		status: TicketStatus;
		now: Date;
	}): Promise<TicketDetailRecord>;
}
