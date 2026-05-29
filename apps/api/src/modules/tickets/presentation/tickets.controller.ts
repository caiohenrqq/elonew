import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { AddTicketMessageUseCase } from '@modules/tickets/application/use-cases/add-ticket-message/add-ticket-message.use-case';
import { CreateTicketUseCase } from '@modules/tickets/application/use-cases/create-ticket/create-ticket.use-case';
import { GetTicketUseCase } from '@modules/tickets/application/use-cases/get-ticket/get-ticket.use-case';
import { ListTicketsUseCase } from '@modules/tickets/application/use-cases/list-tickets/list-tickets.use-case';
import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type AddTicketMessageSchemaInput,
	addTicketMessageSchema,
	type CreateTicketSchemaInput,
	createTicketSchema,
	type ListTicketsQuerySchemaInput,
	listTicketsQuerySchema,
	type TicketIdParamSchemaInput,
	ticketIdParamSchema,
} from './tickets.request-schemas';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT, Role.BOOSTER)
export class TicketsController {
	constructor(
		private readonly createTicket: CreateTicketUseCase,
		private readonly listTickets: ListTicketsUseCase,
		private readonly getTicket: GetTicketUseCase,
		private readonly addTicketMessage: AddTicketMessageUseCase,
	) {}

	@Post()
	async create(
		@Body(new ZodValidationPipe(createTicketSchema))
		body: CreateTicketSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.createTicket.execute({
			userId: currentUser.id,
			role: currentUser.role,
			subject: body.subject,
			content: body.content,
			orderId: body.orderId,
		});
	}

	@Get()
	async list(
		@Query(new ZodValidationPipe(listTicketsQuerySchema))
		query: ListTicketsQuerySchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.listTickets.execute({
			userId: currentUser.id,
			limit: query.limit,
		});
	}

	@Get(':ticketId')
	async get(
		@Param('ticketId', new ZodValidationPipe(ticketIdParamSchema))
		ticketId: TicketIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.getTicket.execute({
			ticketId,
			userId: currentUser.id,
		});
	}

	@Post(':ticketId/messages')
	async reply(
		@Param('ticketId', new ZodValidationPipe(ticketIdParamSchema))
		ticketId: TicketIdParamSchemaInput,
		@Body(new ZodValidationPipe(addTicketMessageSchema))
		body: AddTicketMessageSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.addTicketMessage.execute({
			ticketId,
			userId: currentUser.id,
			role: currentUser.role,
			content: body.content,
		});
	}
}
