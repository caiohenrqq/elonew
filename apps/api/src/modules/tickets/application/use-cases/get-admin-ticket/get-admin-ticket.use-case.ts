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

@Injectable()
export class GetAdminTicketUseCase {
	constructor(
		@Inject(TICKET_REPOSITORY_KEY)
		private readonly tickets: TicketRepositoryPort,
	) {}

	async execute(ticketId: string): Promise<TicketResponse> {
		const ticket = await this.tickets.findById(ticketId);
		if (!ticket) throw new TicketNotFoundError();

		return mapTicketResponse(ticket);
	}
}
