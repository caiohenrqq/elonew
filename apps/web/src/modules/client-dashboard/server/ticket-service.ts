import type { AuthenticatedApiRequest } from './checkout-service';
import {
	createSupportTicketInputSchema,
	type SupportTicketOutput,
	supportTicketSchema,
} from './ticket-contracts';

export const createSupportTicket = async (
	input: unknown,
	apiRequest: AuthenticatedApiRequest,
): Promise<SupportTicketOutput> => {
	const body = createSupportTicketInputSchema.parse(input);
	const response = await apiRequest<unknown>('/tickets', {
		auth: true,
		method: 'POST',
		body: JSON.stringify(body),
	});

	return supportTicketSchema.parse(response);
};

export const listSupportTickets = async (
	apiRequest: AuthenticatedApiRequest,
): Promise<SupportTicketOutput[]> => {
	const response = await apiRequest<unknown>('/tickets?limit=25', {
		auth: true,
	});

	return supportTicketSchema.array().parse(response);
};
