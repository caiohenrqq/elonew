import {
	TICKET_REPOSITORY_KEY,
	type TicketRepositoryPort,
} from '@modules/tickets/application/ports/ticket-repository.port';
import {
	mapTicketResponse,
	type TicketResponse,
} from '@modules/tickets/application/use-cases/ticket-response';
import {
	TicketOrderAccessDeniedError,
	TicketOrderLinkUnsupportedError,
} from '@modules/tickets/domain/ticket.errors';
import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

type CreateTicketInput = {
	userId: string;
	role: Role;
	subject: string;
	content: string;
	orderId?: string;
	now?: Date;
};

@Injectable()
export class CreateTicketUseCase {
	constructor(
		@Inject(TICKET_REPOSITORY_KEY)
		private readonly tickets: TicketRepositoryPort,
	) {}

	async execute(input: CreateTicketInput): Promise<TicketResponse> {
		const orderId = input.orderId ?? null;
		if (orderId) {
			if (input.role !== Role.CLIENT)
				throw new TicketOrderLinkUnsupportedError();
			const ownsOrder = await this.tickets.isClientOrderOwner({
				orderId,
				clientId: input.userId,
			});
			if (!ownsOrder) throw new TicketOrderAccessDeniedError();
		}

		return mapTicketResponse(
			await this.tickets.createWithInitialMessage({
				userId: input.userId,
				userRole: input.role,
				orderId,
				subject: input.subject,
				content: input.content,
				now: input.now ?? new Date(),
			}),
		);
	}
}
