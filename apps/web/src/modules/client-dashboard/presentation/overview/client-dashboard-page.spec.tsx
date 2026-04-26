import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { ClientDashboardPage } from './client-dashboard-page';

jest.mock('next/link', () => ({
	__esModule: true,
	default: ({
		children,
		href,
		...props
	}: PropsWithChildren<{ href: string }>) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

jest.mock('./dashboard-entrance', () => ({
	DashboardEntrance: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

describe('ClientDashboardPage', () => {
	it('renders dashboard metrics and recent order rows', () => {
		render(
			<ClientDashboardPage
				dashboard={{
					orders: [
						{
							id: 'order-1',
							status: 'awaiting_payment',
							statusLabel: 'Aguardando Pagamento',
							statusVariant: 'warning',
							serviceType: 'elo_boost',
							currentLeague: 'gold',
							currentDivision: 'II',
							currentLp: 40,
							desiredLeague: 'platinum',
							desiredDivision: 'IV',
							server: 'br',
							desiredQueue: 'solo_duo',
							lpGain: 20,
							deadline: '2026-05-01T00:00:00.000Z',
							subtotal: 120,
							totalAmount: 120,
							discountAmount: 0,
							createdAt: '2026-04-01T00:00:00.000Z',
						},
					],
					summary: {
						activeOrders: 1,
						totalOrders: 1,
						totalInvested: 120,
					},
				}}
			/>,
		);

		expect(screen.getAllByText('01')).toHaveLength(2);
		expect(screen.getAllByText(/R\$\s*120,00/)).toHaveLength(2);
		expect(screen.getByText('Elo Boost')).toBeInTheDocument();
		expect(screen.getByText('Gold II → Platinum IV')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Ver detalhes/i })).toHaveAttribute(
			'href',
			'/client/orders/order-1',
		);
		expect(
			screen.queryByText('Nenhum pedido encontrado'),
		).not.toBeInTheDocument();
	});

	it('keeps the empty state when no orders exist', () => {
		render(
			<ClientDashboardPage
				dashboard={{
					orders: [],
					summary: {
						activeOrders: 0,
						totalOrders: 0,
						totalInvested: 0,
					},
				}}
			/>,
		);

		expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument();
	});
});
