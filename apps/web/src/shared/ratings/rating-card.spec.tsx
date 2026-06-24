import { render, screen } from '@testing-library/react';
import { useActionState } from 'react';
import { RatingCard } from './rating-card';
import type { RatingOutput } from './rating-contracts';

jest.mock('react', () => ({
	...jest.requireActual('react'),
	useActionState: jest.fn(),
}));

jest.mock('./rating-actions', () => ({
	submitRatingAction: jest.fn(),
}));

const useActionStateMock = useActionState as jest.Mock;

const makeRating = (overrides: Partial<RatingOutput>): RatingOutput => ({
	id: 'rating-1',
	orderId: 'order-1',
	fromUserId: 'client-1',
	toUserId: 'booster-1',
	score: 4,
	comment: null,
	createdAt: '2026-06-24T00:00:00.000Z',
	...overrides,
});

describe('RatingCard', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('shows the submit form when the user has not rated yet', () => {
		useActionStateMock.mockReturnValue([{}, jest.fn(), false]);

		render(
			<RatingCard
				orderId="order-1"
				currentUserId="client-1"
				initialRatings={[]}
			/>,
		);

		expect(
			screen.getByRole('button', { name: /enviar avaliação/i }),
		).toBeInTheDocument();
	});

	it('shows the submitted state when the user already rated', () => {
		useActionStateMock.mockReturnValue([{}, jest.fn(), false]);

		render(
			<RatingCard
				orderId="order-1"
				currentUserId="client-1"
				initialRatings={[makeRating({ score: 4, comment: 'Ótimo serviço' })]}
			/>,
		);

		expect(screen.getByText(/você avaliou este pedido/i)).toBeInTheDocument();
		expect(screen.getByText('Ótimo serviço')).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: /enviar avaliação/i }),
		).not.toBeInTheDocument();
	});

	it('switches to submitted state after a successful action', () => {
		useActionStateMock.mockReturnValue([
			{ rating: makeRating({ score: 5 }) },
			jest.fn(),
			false,
		]);

		render(
			<RatingCard
				orderId="order-1"
				currentUserId="client-1"
				initialRatings={[]}
			/>,
		);

		expect(screen.getByText(/você avaliou este pedido/i)).toBeInTheDocument();
	});

	it('renders an inline error from the action state', () => {
		useActionStateMock.mockReturnValue([
			{ error: 'Você já avaliou este pedido.' },
			jest.fn(),
			false,
		]);

		render(
			<RatingCard
				orderId="order-1"
				currentUserId="client-1"
				initialRatings={[]}
			/>,
		);

		expect(
			screen.getByText('Você já avaliou este pedido.'),
		).toBeInTheDocument();
	});
});
