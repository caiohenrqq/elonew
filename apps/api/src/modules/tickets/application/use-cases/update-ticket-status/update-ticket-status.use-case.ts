import {
	TICKET_REPOSITORY_KEY,
	type TicketRepositoryPort,
} from '@modules/tickets/application/ports/ticket-repository.port';
import {
	mapTicketResponse,
	type TicketResponse,
} from '@modules/tickets/application/use-cases/ticket-response';
import {
	Ticket,
	type TicketStatus,
} from '@modules/tickets/domain/ticket.entity';
import { TicketNotFoundError } from '@modules/tickets/domain/ticket.errors';
import { Inject, Injectable } from '@nestjs/common';

type UpdateTicketStatusInput = {
	ticketId: string;
	status: TicketStatus;
	now?: Date;
};

@Injectable()
export class UpdateTicketStatusUseCase {
	constructor(
		@Inject(TICKET_REPOSITORY_KEY)
		private readonly tickets: TicketRepositoryPort,
	) {}

	async execute(input: UpdateTicketStatusInput): Promise<TicketResponse> {
		const record = await this.tickets.findById(input.ticketId);
		if (!record) throw new TicketNotFoundError();

		const ticket = Ticket.rehydrate(record);
		ticket.updateStatus(input.status, input.now ?? new Date());

		return mapTicketResponse(
			await this.tickets.updateStatus({
				ticket,
				status: ticket.status,
				now: ticket.updatedAt,
			}),
		);
	}
}
