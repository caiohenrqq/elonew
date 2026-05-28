import {
	TICKET_REPOSITORY_KEY,
	type TicketRepositoryPort,
} from '@modules/tickets/application/ports/ticket-repository.port';
import {
	mapTicketResponse,
	type TicketResponse,
} from '@modules/tickets/application/use-cases/ticket-response';
import { TicketNotFoundError } from '@modules/tickets/domain/ticket.errors';
import { Inject, Injectable } from '@nestjs/common';

type GetTicketInput = {
	ticketId: string;
	userId: string;
};

@Injectable()
export class GetTicketUseCase {
	constructor(
		@Inject(TICKET_REPOSITORY_KEY)
		private readonly tickets: TicketRepositoryPort,
	) {}

	async execute(input: GetTicketInput): Promise<TicketResponse> {
		const ticket = await this.tickets.findById(input.ticketId);
		if (!ticket || ticket.userId !== input.userId)
			throw new TicketNotFoundError();

		return mapTicketResponse(ticket);
	}
}
