import { render, screen } from '@testing-library/react';
import { useActionState } from 'react';
import { ResumePaymentButton } from './resume-payment-button';

jest.mock('react', () => ({
	...jest.requireActual('react'),
	useActionState: jest.fn(),
}));

jest.mock('../../actions/order-actions', () => ({
	resumePaymentCheckoutAction: jest.fn(),
}));

const useActionStateMock = useActionState as jest.Mock;

describe('ResumePaymentButton', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('renders the localized resume command', () => {
		useActionStateMock.mockReturnValue([{}, jest.fn(), false]);

		render(<ResumePaymentButton orderId="order-1" />);

		expect(
			screen.getByRole('button', { name: /retomar pagamento/i }),
		).toBeInTheDocument();
	});

	it('shows an inline error when resume fails without auth redirect', () => {
		useActionStateMock.mockReturnValue([
			{
				error:
					'Não foi possível iniciar o pagamento. Tente novamente em instantes.',
			},
			jest.fn(),
			false,
		]);

		render(<ResumePaymentButton orderId="order-1" />);

		expect(
			screen.getByText(
				'Não foi possível iniciar o pagamento. Tente novamente em instantes.',
			),
		).toBeInTheDocument();
	});
});
