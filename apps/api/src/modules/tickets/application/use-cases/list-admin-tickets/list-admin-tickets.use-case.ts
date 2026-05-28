import {
	TICKET_REPOSITORY_KEY,
	type TicketRepositoryPort,
} from '@modules/tickets/application/ports/ticket-repository.port';
import type { TicketSummaryResponse } from '@modules/tickets/application/use-cases/ticket-response';
import type { TicketStatus } from '@modules/tickets/domain/ticket.entity';
import { Inject, Injectable } from '@nestjs/common';

type ListAdminTicketsInput = {
	limit: number;
	status?: TicketStatus;
	query?: string;
};

@Injectable()
export class ListAdminTicketsUseCase {
	constructor(
		@Inject(TICKET_REPOSITORY_KEY)
		private readonly tickets: TicketRepositoryPort,
	) {}

	async execute(
		input: ListAdminTicketsInput,
	): Promise<TicketSummaryResponse[]> {
		return await this.tickets.listForAdmin(input);
	}
}
