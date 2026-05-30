import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import type {
	AdminSupportTicketOutput,
	AdminTicketDetailOutput,
} from '../../server/admin-contracts';
import { AdminSupportWorkspace } from './admin-support-workspace';

jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
}));

jest.mock('../../actions/admin-actions', () => ({
	replyAdminTicketAction: jest.fn(),
	updateAdminTicketStatusAction: jest.fn(),
}));

const useRouterMock = useRouter as jest.Mock;

const tickets: AdminSupportTicketOutput[] = [
	{
		id: 'ticket-closed',
		userId: 'client-2',
		orderId: null,
		subject: 'Ticket resolvido',
		status: 'CLOSED' as const,
		createdAt: '2026-05-01T08:00:00.000Z',
		updatedAt: '2026-05-01T09:00:00.000Z',
		messageCount: 1,
		latestMessageAt: '2026-05-01T09:00:00.000Z',
	},
	{
		id: 'ticket-waiting-support',
		userId: 'client-1',
		orderId: 'order-1',
		subject: 'Pagamento não atualizou',
		status: 'WAITING_SUPPORT' as const,
		createdAt: '2026-05-02T08:00:00.000Z',
		updatedAt: '2026-05-02T09:00:00.000Z',
		messageCount: 2,
		latestMessageAt: '2026-05-02T09:00:00.000Z',
	},
];

const selectedTicket: AdminTicketDetailOutput = {
	id: 'ticket-waiting-support',
	userId: 'client-1',
	orderId: 'order-1',
	subject: 'Pagamento não atualizou',
	status: 'WAITING_SUPPORT' as const,
	createdAt: '2026-05-02T08:00:00.000Z',
	updatedAt: '2026-05-02T09:00:00.000Z',
	messages: [
		{
			id: 'message-1',
			ticketId: 'ticket-waiting-support',
			senderId: 'client-1',
			senderRole: 'CLIENT',
			content: 'Meu pagamento ainda aparece pendente.',
			createdAt: '2026-05-02T08:00:00.000Z',
		},
		{
			id: 'message-2',
			ticketId: 'ticket-waiting-support',
			senderId: 'admin-1',
			senderRole: 'ADMIN',
			content: 'Vamos revisar o status do pedido.',
			createdAt: '2026-05-02T09:00:00.000Z',
		},
	],
};

describe('AdminSupportWorkspace', () => {
	beforeEach(() => {
		useRouterMock.mockReturnValue({ refresh: jest.fn() });
	});

	it('renders the ticket queue and selected ticket detail', () => {
		render(
			<AdminSupportWorkspace
				filters={{}}
				selectedTicket={selectedTicket}
				tickets={tickets}
			/>,
		);

		expect(
			screen.getByRole('heading', { name: 'Suporte' }),
		).toBeInTheDocument();
		expect(screen.getAllByText('Pagamento não atualizou')).toHaveLength(2);
		expect(
			screen.getAllByText('Aguardando suporte').length,
		).toBeGreaterThanOrEqual(2);
		expect(
			screen.getByText('Meu pagamento ainda aparece pendente.'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Vamos revisar o status do pedido.'),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /responder/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /atualizar/i }),
		).toBeInTheDocument();
	});

	it('renders tickets in the same table action pattern used by admin pages', () => {
		render(
			<AdminSupportWorkspace
				filters={{}}
				selectedTicket={selectedTicket}
				tickets={tickets}
			/>,
		);

		expect(
			screen.getByRole('columnheader', { name: 'Chamado' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('columnheader', { name: 'Atendimento' }),
		).toBeInTheDocument();

		const openLinks = screen.getAllByRole('link', { name: /abrir/i });
		expect(openLinks).toHaveLength(2);
		expect(openLinks[0]).toHaveAttribute(
			'href',
			'/admin/support?ticketId=ticket-waiting-support',
		);
		expect(openLinks[1]).toHaveAttribute(
			'href',
			'/admin/support?ticketId=ticket-closed',
		);
	});

	it('renders an empty state when no ticket is selected', () => {
		render(
			<AdminSupportWorkspace filters={{}} selectedTicket={null} tickets={[]} />,
		);

		expect(screen.getByText('Nenhum ticket encontrado')).toBeInTheDocument();
		expect(screen.getByText('Selecione um ticket')).toBeInTheDocument();
	});
});
