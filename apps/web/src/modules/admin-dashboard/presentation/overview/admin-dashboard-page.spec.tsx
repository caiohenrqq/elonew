import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
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
	forceCancelAdminOrderAction: jest.fn(),
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

	it('renders users on the dedicated users page', () => {
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
						createdAt: '2026-05-01T00:00:00.000Z',
					},
				]}
			/>,
		);

		expect(screen.getByText('Usuários')).toBeInTheDocument();
		expect(screen.getByText('CLIENTE')).toBeInTheDocument();
		expect(screen.getByText('ATIVO')).toBeInTheDocument();
		expect(screen.getByText('LIBERADO')).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('Motivo obrigatório da auditoria'),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Bloquear' }),
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
		expect(screen.getByText('Aguardando booster')).toBeInTheDocument();
		expect(screen.getByText(/Cancelamento forçado/i)).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('Motivo obrigatório do cancelamento'),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Cancelar' }),
		).toBeInTheDocument();
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
		expect(screen.getByText('Preciso de ajuda')).toBeInTheDocument();
		expect(screen.getByText('Aberto')).toBeInTheDocument();
		expect(screen.getByText('2 mensagens')).toBeInTheDocument();
	});

	it('renders polished empty states on dedicated pages', () => {
		const { rerender } = render(<AdminUsersPage users={[]} />);

		expect(screen.getByText('Nenhum usuário encontrado')).toBeInTheDocument();

		rerender(<AdminOrdersPage orders={[]} />);
		expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument();

		rerender(<AdminSupportPage tickets={[]} />);
		expect(screen.getByText('Nenhum ticket encontrado')).toBeInTheDocument();
		expect(screen.queryByText(/returned by the API/i)).not.toBeInTheDocument();
	});
});
