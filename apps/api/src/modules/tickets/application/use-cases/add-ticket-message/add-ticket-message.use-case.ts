import {
	TICKET_REPOSITORY_KEY,
	type TicketRepositoryPort,
} from '@modules/tickets/application/ports/ticket-repository.port';
import {
	mapTicketResponse,
	type TicketResponse,
} from '@modules/tickets/application/use-cases/ticket-response';
import { Ticket } from '@modules/tickets/domain/ticket.entity';
import { TicketNotFoundError } from '@modules/tickets/domain/ticket.errors';
import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '@packages/auth/roles/role';

type AddTicketMessageInput = {
	ticketId: string;
	userId: string;
	role: Role;
	content: string;
	now?: Date;
};

@Injectable()
export class AddTicketMessageUseCase {
	constructor(
		@Inject(TICKET_REPOSITORY_KEY)
		private readonly tickets: TicketRepositoryPort,
	) {}

	async execute(input: AddTicketMessageInput): Promise<TicketResponse> {
		const record = await this.tickets.findById(input.ticketId);
		if (!record || record.userId !== input.userId)
			throw new TicketNotFoundError();

		const ticket = Ticket.rehydrate(record);
		const now = input.now ?? new Date();
		ticket.recordReply({
			senderId: input.userId,
			senderRole: input.role,
			now,
		});

		return mapTicketResponse(
			await this.tickets.addMessage({
				ticket,
				senderId: input.userId,
				senderRole: input.role,
				content: input.content,
				now,
			}),
		);
	}
}
