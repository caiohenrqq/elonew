import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ClientDashboardOrder } from '../../model/orders';
import { SupportTicketPanel } from './support-ticket-panel';

const buildOrder = (
	overrides: Partial<ClientDashboardOrder> = {},
): ClientDashboardOrder => ({
	id: 'order-1234abcd',
	status: 'in_progress',
	serviceType: 'elo_boost',
	currentLeague: 'gold',
	currentDivision: 'II',
	currentLp: 40,
	desiredLeague: 'platinum',
	desiredDivision: 'IV',
	server: 'br',
	desiredQueue: 'solo_duo',
	lpGain: 20,
	deadline: null,
	subtotal: 120,
	totalAmount: 120,
	discountAmount: 0,
	createdAt: '2026-05-01T00:00:00.000Z',
	...overrides,
});

describe('SupportTicketPanel', () => {
	it('renders the ticket form fields and an option per order', () => {
		render(
			<SupportTicketPanel
				action={jest.fn().mockResolvedValue({})}
				orders={[buildOrder()]}
			/>,
		);

		expect(screen.getByText('Assunto')).toBeInTheDocument();
		expect(screen.getByText('Mensagem')).toBeInTheDocument();
		expect(
			screen.getByText(
				'Vincule um pedido quando o assunto for sobre um serviço específico.',
			),
		).toBeInTheDocument();
		expect(screen.getAllByRole('option')).toHaveLength(2);
		expect(screen.getByText('01 disponíveis')).toBeInTheDocument();
	});

	it('shows the empty-orders helper when there are no orders', () => {
		render(
			<SupportTicketPanel
				action={jest.fn().mockResolvedValue({})}
				orders={[]}
			/>,
		);

		expect(
			screen.getByText('Você ainda não tem pedidos para vincular.'),
		).toBeInTheDocument();
		expect(screen.getByText('00 disponíveis')).toBeInTheDocument();
	});

	it('surfaces the action error message after submitting', async () => {
		const action = jest.fn().mockResolvedValue({ error: 'Revise os dados.' });
		render(<SupportTicketPanel action={action} orders={[]} />);

		const form = screen
			.getByRole('button', { name: /criar ticket/i })
			.closest('form');
		expect(form).not.toBeNull();
		fireEvent.submit(form as HTMLFormElement);

		await waitFor(() =>
			expect(screen.getByText('Revise os dados.')).toBeInTheDocument(),
		);
		expect(action).toHaveBeenCalledTimes(1);
	});
});
