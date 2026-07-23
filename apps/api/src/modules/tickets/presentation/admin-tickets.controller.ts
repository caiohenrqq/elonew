import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { AddAdminTicketMessageUseCase } from '@modules/tickets/application/use-cases/add-admin-ticket-message/add-admin-ticket-message.use-case';
import { GetAdminTicketUseCase } from '@modules/tickets/application/use-cases/get-admin-ticket/get-admin-ticket.use-case';
import { ListAdminTicketsUseCase } from '@modules/tickets/application/use-cases/list-admin-tickets/list-admin-tickets.use-case';
import { UpdateTicketStatusUseCase } from '@modules/tickets/application/use-cases/update-ticket-status/update-ticket-status.use-case';
import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import {
	type AddTicketMessageSchemaInput,
	addTicketMessageSchema,
	type ListAdminTicketsQuerySchemaInput,
	listAdminTicketsQuerySchema,
	type TicketIdParamSchemaInput,
	ticketIdParamSchema,
	type UpdateTicketStatusSchemaInput,
	updateTicketStatusSchema,
} from './tickets.request-schemas';

@Controller('admin/tickets')
@Roles(Role.ADMIN)
export class AdminTicketsController {
	constructor(
		private readonly listAdminTickets: ListAdminTicketsUseCase,
		private readonly getAdminTicket: GetAdminTicketUseCase,
		private readonly addAdminTicketMessage: AddAdminTicketMessageUseCase,
		private readonly updateTicketStatus: UpdateTicketStatusUseCase,
	) {}

	@Get()
	async list(
		@Query(new ZodValidationPipe(listAdminTicketsQuerySchema))
		query: ListAdminTicketsQuerySchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.listAdminTickets.execute(query);
	}

	@Get(':ticketId')
	async get(
		@Param('ticketId', new ZodValidationPipe(ticketIdParamSchema))
		ticketId: TicketIdParamSchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.getAdminTicket.execute(ticketId);
	}

	@Post(':ticketId/messages')
	async reply(
		@Param('ticketId', new ZodValidationPipe(ticketIdParamSchema))
		ticketId: TicketIdParamSchemaInput,
		@Body(new ZodValidationPipe(addTicketMessageSchema))
		body: AddTicketMessageSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	) {
		return await this.addAdminTicketMessage.execute({
			ticketId,
			adminUserId: currentUser.id,
			content: body.content,
		});
	}

	@Patch(':ticketId/status')
	async updateStatus(
		@Param('ticketId', new ZodValidationPipe(ticketIdParamSchema))
		ticketId: TicketIdParamSchemaInput,
		@Body(new ZodValidationPipe(updateTicketStatusSchema))
		body: UpdateTicketStatusSchemaInput,
		@CurrentUser() _currentUser: AuthenticatedUser,
	) {
		return await this.updateTicketStatus.execute({
			ticketId,
			status: body.status,
		});
	}
}
