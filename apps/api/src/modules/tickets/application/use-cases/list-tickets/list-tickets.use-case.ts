import {
	TICKET_REPOSITORY_KEY,
	type TicketRepositoryPort,
} from '@modules/tickets/application/ports/ticket-repository.port';
import type { TicketSummaryResponse } from '@modules/tickets/application/use-cases/ticket-response';
import { Inject, Injectable } from '@nestjs/common';

type ListTicketsInput = {
	userId: string;
	limit: number;
};

@Injectable()
export class ListTicketsUseCase {
	constructor(
		@Inject(TICKET_REPOSITORY_KEY)
		private readonly tickets: TicketRepositoryPort,
	) {}

	async execute(input: ListTicketsInput): Promise<TicketSummaryResponse[]> {
		return await this.tickets.listForUser(input);
	}
}
