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
import { Role } from '@packages/auth/roles/role';

type AddAdminTicketMessageInput = {
	ticketId: string;
	adminUserId: string;
	content: string;
	now?: Date;
};

@Injectable()
export class AddAdminTicketMessageUseCase {
	constructor(
		@Inject(TICKET_REPOSITORY_KEY)
		private readonly tickets: TicketRepositoryPort,
	) {}

	async execute(input: AddAdminTicketMessageInput): Promise<TicketResponse> {
		const record = await this.tickets.findById(input.ticketId);
		if (!record) throw new TicketNotFoundError();

		const ticket = Ticket.rehydrate(record);
		const now = input.now ?? new Date();
		ticket.recordReply({
			senderId: input.adminUserId,
			senderRole: Role.ADMIN,
			now,
		});

		return mapTicketResponse(
			await this.tickets.addMessage({
				ticket,
				senderId: input.adminUserId,
				senderRole: Role.ADMIN,
				content: input.content,
				now,
			}),
		);
	}
}
