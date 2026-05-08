import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

jest.mock('@/shared/dashboard/dashboard-entrance', () => ({
	DashboardEntrance: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('./client-dashboard-live-refresh', () => ({
	ClientDashboardLiveRefresh: () => null,
}));

describe('ClientDashboardPage', () => {
	beforeEach(() => {
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: jest.fn().mockResolvedValue(undefined),
			},
		});
	});

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

	it('renders the development checkout tutorial and copies snippets', async () => {
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
				devPaymentId="payment-dev-1"
			/>,
		);

		expect(
			screen.getByRole('dialog', { name: /Development checkout/i }),
		).toBeInTheDocument();
		expect(
			screen.getByText('POST /payments/dev/payment-dev-1/simulate'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Authorization: Bearer <accessToken>'),
		).toBeInTheDocument();
		expect(screen.getByText(/"outcome": "approved"/)).toBeInTheDocument();
		expect(screen.getByText('Outcome options')).toBeInTheDocument();
		expect(screen.getAllByText('approved').length).toBeGreaterThan(0);
		expect(screen.getByText('rejected')).toBeInTheDocument();
		expect(screen.getByText(/client@elojob.com/)).toBeInTheDocument();
		expect(screen.queryByText(/Manual/i)).not.toBeInTheDocument();

		expect(
			screen.queryByText(/Authorization: Bearer dev-access-token/),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /Copy Endpoint/i }));

		await waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
				'/payments/dev/payment-dev-1/simulate',
			);
		});

		fireEvent.click(screen.getByRole('button', { name: /Copy Access token/i }));

		await waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
				'Authorization: Bearer <accessToken>',
			);
		});

		fireEvent.click(screen.getByRole('button', { name: /^Copy Body$/i }));

		await waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
				'{\n  "outcome": "approved"\n}',
			);
		});
	});
});
