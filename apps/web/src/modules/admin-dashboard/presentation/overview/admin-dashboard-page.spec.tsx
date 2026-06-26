import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { AdminOrderDetailsView } from '../order-details/admin-order-details-page';
import {
	AdminDashboardPage,
	AdminOrdersPage,
	AdminSupportPage,
	AdminUsersPage,
} from './admin-dashboard-page';

jest.mock('@/shared/dashboard/dashboard-entrance', () => ({
	DashboardEntrance: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('../../actions/admin-actions', () => ({
	blockAdminUserAction: jest.fn(),
	createAdminUserAction: jest.fn(),
	forceCancelAdminOrderAction: jest.fn(),
	resendAdminUserPasswordSetupAction: jest.fn(),
	unblockAdminUserAction: jest.fn(),
}));

describe('admin dashboard pages', () => {
	it('renders only overview metrics on the main admin page', () => {
		render(
			<AdminDashboardPage
				metrics={{
					revenueTotal: 240,
					ordersTotal: 4,
					activeOrders: 2,
					activeUsers: 3,
				}}
			/>,
		);

		expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();
		expect(screen.getByText('Receita')).toBeInTheDocument();
		expect(screen.getByText('Pedidos ativos')).toBeInTheDocument();
		expect(screen.getByText('Usuários ativos')).toBeInTheDocument();
		expect(screen.queryByText('dev-client')).not.toBeInTheDocument();
		expect(screen.queryByText('Preciso de ajuda')).not.toBeInTheDocument();
	});

	it('opens user admin actions in a modal', async () => {
		const user = userEvent.setup();

		render(
			<AdminUsersPage
				users={[
					{
						id: 'user-1',
						username: 'dev-client',
						email: 'client@elojob.com',
						role: 'CLIENT',
						isActive: true,
						isBlocked: false,
						activationStatus: 'ACTIVE',
						createdAt: '2026-05-01T00:00:00.000Z',
					},
				]}
			/>,
		);

		expect(screen.getByText('Usuários')).toBeInTheDocument();
		expect(screen.getAllByText('CLIENTE').length).toBeGreaterThan(0);
		expect(screen.getAllByText('ATIVO').length).toBeGreaterThan(0);
		expect(screen.getAllByText('LIBERADO').length).toBeGreaterThan(0);
		expect(
			screen.queryByPlaceholderText('Motivo obrigatório da auditoria'),
		).not.toBeInTheDocument();

		await user.click(screen.getAllByRole('button', { name: 'Bloquear' })[0]);

		expect(
			screen.getByRole('dialog', { name: 'Bloquear' }),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('Motivo obrigatório da auditoria'),
		).toBeInTheDocument();
	});

	it('renders orders on the dedicated orders page', () => {
		render(
			<AdminOrdersPage
				orders={[
					{
						id: 'order-1',
						clientId: 'client-1',
						boosterId: null,
						status: 'pending_booster',
						serviceType: 'elo_boost',
						totalAmount: 120,
						createdAt: '2026-05-01T00:00:00.000Z',
						latestGovernanceAction: {
							type: 'force_cancel_order',
							reason: 'Pagamento duplicado',
							createdAt: '2026-05-02T00:00:00.000Z',
						},
					},
				]}
			/>,
		);

		expect(screen.getByText('Pedidos')).toBeInTheDocument();
		expect(screen.getAllByText('Aguardando booster').length).toBeGreaterThan(0);
		expect(screen.getAllByText(/Cancelamento forçado/i).length).toBeGreaterThan(
			0,
		);
		expect(
			screen.queryByPlaceholderText('Motivo obrigatório do cancelamento'),
		).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: /ver detalhes/i })).toHaveAttribute(
			'href',
			'/admin/orders/order-1',
		);
		expect(
			screen.queryByRole('button', { name: 'Cancelar pedido' }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText('Pode começar pelo mid.'),
		).not.toBeInTheDocument();
	});

	it('renders the admin order detail page with read-only chat and governance', () => {
		render(
			<AdminOrderDetailsView
				currentUserId="admin-1"
				messages={[
					{
						id: 'message-1',
						orderId: 'order-1',
						chatId: 'chat-1',
						content: 'Pode começar pelo mid.',
						sender: {
							id: 'client-1',
							username: 'Client',
							role: 'CLIENT',
						},
						createdAt: '2026-05-01T10:00:00.000Z',
					},
				]}
				order={{
					id: 'order-1',
					clientId: 'client-1',
					boosterId: null,
					status: 'pending_booster',
					serviceType: 'elo_boost',
					totalAmount: 120,
					createdAt: '2026-05-01T00:00:00.000Z',
					latestGovernanceAction: {
						type: 'force_cancel_order',
						reason: 'Pagamento duplicado',
						createdAt: '2026-05-02T00:00:00.000Z',
					},
				}}
			/>,
		);

		expect(
			screen.getByRole('link', { name: /voltar aos pedidos/i }),
		).toHaveAttribute('href', '/admin/orders');
		expect(
			screen.getByRole('button', { name: 'Cancelar pedido' }),
		).toBeInTheDocument();
		expect(screen.getByText('Pode começar pelo mid.')).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: /enviar mensagem/i }),
		).not.toBeInTheDocument();
	});

	it('disables force cancel on already cancelled orders', async () => {
		const user = userEvent.setup();

		render(
			<AdminOrderDetailsView
				currentUserId="admin-1"
				messages={[]}
				order={{
					id: 'order-1',
					clientId: 'client-1',
					boosterId: null,
					status: 'cancelled',
					serviceType: 'elo_boost',
					totalAmount: 120,
					createdAt: '2026-05-01T00:00:00.000Z',
					latestGovernanceAction: {
						type: 'force_cancel_order',
						reason: 'Pagamento duplicado',
						createdAt: '2026-05-02T00:00:00.000Z',
					},
				}}
			/>,
		);

		const cancelButton = screen.getByRole('button', {
			name: 'Cancelar pedido',
		});
		expect(cancelButton).toBeDisabled();
		expect(
			screen.getByText('Pedido já cancelado. Nenhuma nova ação é necessária.'),
		).toBeInTheDocument();

		await user.click(cancelButton);

		expect(
			screen.queryByPlaceholderText('Motivo obrigatório do cancelamento'),
		).not.toBeInTheDocument();
	});

	it('renders support tickets on the dedicated support page', () => {
		render(
			<AdminSupportPage
				tickets={[
					{
						id: 'ticket-1',
						userId: 'client-1',
						subject: 'Preciso de ajuda',
						status: 'OPEN',
						createdAt: '2026-05-01T00:00:00.000Z',
						updatedAt: '2026-05-02T00:00:00.000Z',
						messageCount: 2,
						latestMessageAt: '2026-05-02T00:00:00.000Z',
					},
				]}
			/>,
		);

		expect(screen.getByText('Suporte')).toBeInTheDocument();
		expect(screen.getAllByText('Preciso de ajuda').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Aberto').length).toBeGreaterThan(0);
		expect(screen.getByText('2 mensagens')).toBeInTheDocument();
	});

	it('renders polished empty states on dedicated pages', () => {
		const { rerender } = render(<AdminUsersPage users={[]} />);

		expect(
			screen.getAllByText('Nenhum usuário encontrado').length,
		).toBeGreaterThan(0);

		rerender(<AdminOrdersPage orders={[]} />);
		expect(
			screen.getAllByText('Nenhum pedido encontrado').length,
		).toBeGreaterThan(0);

		rerender(<AdminSupportPage tickets={[]} />);
		expect(
			screen.getAllByText('Nenhum ticket encontrado').length,
		).toBeGreaterThan(0);
		expect(screen.queryByText(/returned by the API/i)).not.toBeInTheDocument();
	});
});
