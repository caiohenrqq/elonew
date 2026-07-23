import { PrismaModule } from '@app/common/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { TICKET_REPOSITORY_KEY } from '@modules/tickets/application/ports/ticket-repository.port';
import { AddAdminTicketMessageUseCase } from '@modules/tickets/application/use-cases/add-admin-ticket-message/add-admin-ticket-message.use-case';
import { AddTicketMessageUseCase } from '@modules/tickets/application/use-cases/add-ticket-message/add-ticket-message.use-case';
import { CreateTicketUseCase } from '@modules/tickets/application/use-cases/create-ticket/create-ticket.use-case';
import { GetAdminTicketUseCase } from '@modules/tickets/application/use-cases/get-admin-ticket/get-admin-ticket.use-case';
import { GetTicketUseCase } from '@modules/tickets/application/use-cases/get-ticket/get-ticket.use-case';
import { ListAdminTicketsUseCase } from '@modules/tickets/application/use-cases/list-admin-tickets/list-admin-tickets.use-case';
import { ListTicketsUseCase } from '@modules/tickets/application/use-cases/list-tickets/list-tickets.use-case';
import { UpdateTicketStatusUseCase } from '@modules/tickets/application/use-cases/update-ticket-status/update-ticket-status.use-case';
import { PrismaTicketRepository } from '@modules/tickets/infrastructure/repositories/prisma-ticket.repository';
import { AdminTicketsController } from '@modules/tickets/presentation/admin-tickets.controller';
import { TicketsController } from '@modules/tickets/presentation/tickets.controller';
import { Module } from '@nestjs/common';

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [AdminTicketsController, TicketsController],
	providers: [
		PrismaTicketRepository,
		{
			provide: TICKET_REPOSITORY_KEY,
			useExisting: PrismaTicketRepository,
		},
		AddAdminTicketMessageUseCase,
		AddTicketMessageUseCase,
		CreateTicketUseCase,
		GetAdminTicketUseCase,
		GetTicketUseCase,
		ListAdminTicketsUseCase,
		ListTicketsUseCase,
		UpdateTicketStatusUseCase,
	],
})
export class TicketsModule {}
