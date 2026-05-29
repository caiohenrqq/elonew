import type {
	TicketMessage,
	TicketStatus,
} from '@modules/tickets/domain/ticket.entity';
import type { Role } from '@packages/auth/roles/role';

export type TicketResponse = {
	id: string;
	userId: string;
	orderId: string | null;
	subject: string;
	status: TicketStatus;
	createdAt: Date;
	updatedAt: Date;
	messages: TicketMessageResponse[];
};

export type TicketSummaryResponse = Omit<TicketResponse, 'messages'> & {
	messageCount: number;
	latestMessageAt: Date | null;
};

export type TicketMessageResponse = {
	id: string;
	ticketId: string;
	senderId: string;
	senderRole: Role;
	content: string;
	createdAt: Date;
};

export function mapTicketResponse(input: {
	id: string;
	userId: string;
	orderId: string | null;
	subject: string;
	status: TicketStatus;
	createdAt: Date;
	updatedAt: Date;
	messages: TicketMessage[];
}): TicketResponse {
	return {
		...input,
		messages: input.messages.map(mapTicketMessageResponse),
	};
}

export function mapTicketMessageResponse(
	message: TicketMessage,
): TicketMessageResponse {
	return { ...message };
}
