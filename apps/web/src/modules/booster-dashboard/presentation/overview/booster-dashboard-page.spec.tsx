import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import {
	getBoosterQueue,
	getBoosterWalletTransactions,
	getBoosterWork,
} from '../../actions/booster-actions';
import { BoosterDashboardPage } from './booster-dashboard-page';

jest.mock('../../actions/booster-actions', () => ({
	getBoosterQueue: jest.fn().mockResolvedValue({
		availableOrders: [
			{
				id: 'order-queue-1',
				boosterId: null,
				status: 'pending_booster',
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
				totalAmount: 120,
				boosterAmount: 84,
				createdAt: '2026-04-01T00:00:00.000Z',
			},
		],
		summary: {
			availableOrders: 1,
			estimatedAvailableEarnings: 84,
		},
	}),
	getBoosterWork: jest.fn().mockResolvedValue({
		activeOrders: [],
		recentCompletedOrders: [],
		summary: {
			activeOrders: 0,
			completedOrders: 0,
			earnedFromRecentCompletions: 0,
		},
	}),
	getBoosterWallet: jest.fn().mockResolvedValue({
		boosterId: 'booster-1',
		balanceLocked: 30,
		balanceWithdrawable: 84,
	}),
	getBoosterWalletTransactions: jest.fn().mockResolvedValue({
		transactions: [
			{
				id: 'transaction-1',
				orderId: 'order-queue-1',
				amount: 84,
				type: 'credit',
				reason: 'order_completion',
				availableAt: '2026-05-01T00:00:00.000Z',
				releasedAt: '2026-05-02T00:00:00.000Z',
				createdAt: '2026-05-01T00:00:00.000Z',
			},
		],
	}),
	acceptBoosterOrderAction: jest.fn(),
	rejectBoosterOrderAction: jest.fn(),
	completeBoosterOrderAction: jest.fn(),
	requestBoosterWithdrawalAction: jest.fn(),
}));

jest.mock('@/shared/dashboard/dashboard-entrance', () => ({
	DashboardEntrance: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('./booster-dashboard-live-refresh', () => ({
	BoosterDashboardLiveRefresh: () => null,
}));

jest.mock('lucide-react', () => ({
	BadgeDollarSign: () => <svg data-testid="money-icon" />,
	BriefcaseBusiness: () => <svg data-testid="briefcase-icon" />,
	CheckCircle2: () => <svg data-testid="check-icon" />,
	ListChecks: () => <svg data-testid="list-icon" />,
	PackageCheck: () => <svg data-testid="package-check-icon" />,
	PackageOpen: () => <svg data-testid="package-open-icon" />,
	ReceiptText: () => <svg data-testid="receipt-icon" />,
	XCircle: () => <svg data-testid="reject-icon" />,
	WalletCards: () => <svg data-testid="wallet-icon" />,
	ArrowDownLeft: () => <svg data-testid="credit-icon" />,
	ArrowUpRight: () => <svg data-testid="debit-icon" />,
}));

describe('BoosterDashboardPage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders queue and wallet balances without fetching work data', async () => {
		render(await BoosterDashboardPage());

		expect(screen.getByText('Pedidos disponíveis')).toBeInTheDocument();
		expect(
			screen.queryByText('Meus pedidos em execução'),
		).not.toBeInTheDocument();
		expect(screen.getByText('Elo Boost')).toBeInTheDocument();
		expect(screen.getByText('Gold II -> Platinum IV')).toBeInTheDocument();
		expect(screen.getAllByText(/R\$\s*84,00/).length).toBeGreaterThan(0);
		expect(screen.getByText('Carteira')).toBeInTheDocument();
		expect(screen.queryByText('Movimentações')).not.toBeInTheDocument();
		expect(getBoosterQueue).toHaveBeenCalledTimes(1);
		expect(getBoosterWork).not.toHaveBeenCalled();
		expect(getBoosterWalletTransactions).not.toHaveBeenCalled();
	});

	it('renders active and completed orders on the work tab only', async () => {
		render(await BoosterDashboardPage({ tab: 'work' }));

		expect(screen.getByText('Meus pedidos em execução')).toBeInTheDocument();
		expect(screen.getByText('Finalizados recentes')).toBeInTheDocument();
		expect(screen.queryByText('Pedidos disponíveis')).not.toBeInTheDocument();
		expect(screen.getByText('Movimentações')).toBeInTheDocument();
		expect(screen.getByText('Conclusão de pedido')).toBeInTheDocument();
		expect(getBoosterWork).toHaveBeenCalledTimes(1);
		expect(getBoosterQueue).not.toHaveBeenCalled();
		expect(getBoosterWalletTransactions).toHaveBeenCalledTimes(1);
	});
});
