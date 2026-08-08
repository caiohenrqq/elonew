import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notFound } from 'next/navigation';
import {
	getBoosterOrder,
	getBoosterOrderChatMessages,
	getBoosterUserId,
	revealBoosterOrderCredentialsAction,
} from '../../actions/booster-actions';
import { BoosterOrderDetailsPage } from './booster-order-details-page';

jest.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: jest.fn() }),
	notFound: jest.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

jest.mock('@/shared/ratings/rating-actions', () => ({
	getOrderRatings: jest.fn().mockResolvedValue([]),
	submitRatingAction: jest.fn(),
}));

jest.mock('../../actions/booster-actions', () => ({
	completeBoosterOrderAction: jest.fn(),
	getBoosterOrder: jest.fn().mockResolvedValue({
		id: 'order-active-1',
		boosterId: 'booster-1',
		status: 'in_progress',
		serviceType: 'elo_boost',
		currentLeague: 'silver',
		currentDivision: 'IV',
		currentLp: 0,
		desiredLeague: 'diamond',
		desiredDivision: 'IV',
		server: 'br',
		desiredQueue: 'solo_duo',
		lpGain: 20,
		deadline: '2026-06-06T00:00:00.000Z',
		totalAmount: 585,
		boosterAmount: 409.25,
		createdAt: '2026-05-30T00:00:00.000Z',
	}),
	getBoosterOrderChatMessages: jest.fn().mockResolvedValue({
		items: [
			{
				id: 'message-1',
				orderId: 'order-active-1',
				chatId: 'chat-1',
				content: 'Pode começar pelo mid.',
				sender: {
					id: 'client-1',
					username: 'Client',
					role: 'CLIENT',
				},
				createdAt: '2026-05-30T10:00:00.000Z',
			},
		],
		nextCursor: null,
	}),
	getBoosterUserId: jest.fn().mockResolvedValue('booster-1'),
	revealBoosterOrderCredentialsAction: jest.fn().mockResolvedValue({
		credentials: {
			login: 'client-login',
			summonerName: 'Summoner BR',
			password: 'secret-password',
		},
	}),
}));

jest.mock('lucide-react', () => ({
	CheckCircle2: () => <svg data-testid="check-icon" />,
	Send: () => <svg data-testid="send-icon" />,
	Star: () => <svg data-testid="star-icon" />,
	X: () => <svg data-testid="close-icon" />,
}));

describe('BoosterOrderDetailsPage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders the order chat as the primary detail surface', async () => {
		render(await BoosterOrderDetailsPage({ orderId: 'order-active-1' }));

		expect(
			screen.getByRole('heading', { name: /Silver IV → Diamond IV/i }),
		).toBeInTheDocument();
		expect(screen.getByText('Chat do pedido')).toBeInTheDocument();
		expect(screen.getByText('Pode começar pelo mid.')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /Finalizar pedido/i }),
		).toBeInTheDocument();
		await userEvent.click(
			screen.getByRole('button', { name: /Finalizar pedido/i }),
		);
		expect(
			screen.getByRole('heading', { name: /Finalizar pedido/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /Confirmar finalização/i }),
		).toBeInTheDocument();
		expect(getBoosterOrder).toHaveBeenCalledWith('order-active-1');
		expect(getBoosterOrderChatMessages).toHaveBeenCalledWith('order-active-1');
		expect(getBoosterUserId).toHaveBeenCalledTimes(1);
	});

	it('reveals accepted-order credentials only after an explicit click', async () => {
		render(await BoosterOrderDetailsPage({ orderId: 'order-active-1' }));

		expect(screen.queryByText('client-login')).not.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole('button', { name: /Revelar credenciais/i }),
		);

		expect(revealBoosterOrderCredentialsAction).toHaveBeenCalledWith(
			'order-active-1',
		);
		expect(screen.getByText('client-login')).toBeInTheDocument();
		expect(screen.getByText('Summoner BR')).toBeInTheDocument();
		expect(screen.getByText('secret-password')).toBeInTheDocument();
	});

	it('renders completed orders as read-only chat', async () => {
		jest.mocked(getBoosterOrder).mockResolvedValueOnce({
			id: 'order-completed-1',
			boosterId: 'booster-1',
			status: 'completed',
			serviceType: 'elo_boost',
			currentLeague: 'silver',
			currentDivision: 'IV',
			currentLp: 0,
			desiredLeague: 'gold',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: '2026-06-06T00:00:00.000Z',
			totalAmount: 120,
			boosterAmount: 84,
			createdAt: '2026-05-30T00:00:00.000Z',
		});

		render(await BoosterOrderDetailsPage({ orderId: 'order-completed-1' }));

		expect(screen.getByText('Somente leitura')).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: /Finalizar pedido/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('textbox', { name: /Mensagem do chat/i }),
		).not.toBeInTheDocument();
	});

	it('uses the not found boundary when the order does not belong to the booster', async () => {
		jest.mocked(getBoosterOrder).mockResolvedValueOnce(null);

		await expect(
			BoosterOrderDetailsPage({ orderId: 'missing-order' }),
		).rejects.toThrow('NEXT_NOT_FOUND');

		expect(notFound).toHaveBeenCalledTimes(1);
	});
});
