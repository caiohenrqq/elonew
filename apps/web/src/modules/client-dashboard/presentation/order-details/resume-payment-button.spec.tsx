import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resumePaymentCheckoutAction } from '../../actions/order-actions';
import { ResumePaymentButton } from './resume-payment-button';

jest.mock('../../actions/order-actions', () => ({
	resumePaymentCheckoutAction: jest.fn(),
}));

const makeCheckoutTab = () => ({
	close: jest.fn(),
	location: { href: '' } as Location,
});

describe('ResumePaymentButton', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('renders the localized resume command', () => {
		render(<ResumePaymentButton orderId="order-1" />);

		expect(
			screen.getByRole('button', { name: /retomar pagamento/i }),
		).toBeInTheDocument();
	});

	it('opens the checkout in a new tab on resume', async () => {
		const checkoutTab = makeCheckoutTab();
		(resumePaymentCheckoutAction as jest.Mock).mockResolvedValue({
			checkoutUrl: 'https://checkout.example.com/pay',
		});

		render(
			<ResumePaymentButton
				orderId="order-1"
				openCheckoutTab={() => checkoutTab}
			/>,
		);

		await userEvent.click(
			screen.getByRole('button', { name: /retomar pagamento/i }),
		);

		await waitFor(() => {
			expect(checkoutTab.location.href).toBe(
				'https://checkout.example.com/pay',
			);
		});
		expect(resumePaymentCheckoutAction).toHaveBeenCalledWith('order-1');
	});

	it('shows an inline error and closes the tab when resume fails', async () => {
		const checkoutTab = makeCheckoutTab();
		(resumePaymentCheckoutAction as jest.Mock).mockResolvedValue({
			error:
				'Não foi possível iniciar o pagamento. Tente novamente em instantes.',
		});

		render(
			<ResumePaymentButton
				orderId="order-1"
				openCheckoutTab={() => checkoutTab}
			/>,
		);

		await userEvent.click(
			screen.getByRole('button', { name: /retomar pagamento/i }),
		);

		expect(
			await screen.findByText(
				'Não foi possível iniciar o pagamento. Tente novamente em instantes.',
			),
		).toBeInTheDocument();
		expect(checkoutTab.close).toHaveBeenCalled();
	});
});
