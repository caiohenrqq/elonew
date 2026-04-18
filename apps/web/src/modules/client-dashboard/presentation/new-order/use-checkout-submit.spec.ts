import { act, renderHook, waitFor } from '@testing-library/react';
import { startCheckoutAction } from '../../actions/order-actions';
import { createInitialCheckoutInput } from '../../model/checkout-defaults';
import { useCheckoutSubmit } from './use-checkout-submit';

jest.mock('../../actions/order-actions', () => ({
	startCheckoutAction: jest.fn(),
}));

describe('useCheckoutSubmit', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('sets a validation error when terms are not accepted', () => {
		const { result } = renderHook(() =>
			useCheckoutSubmit({
				hasAcceptedTerms: false,
				orderInput: createInitialCheckoutInput(),
			}),
		);

		act(() => {
			result.current.handleCheckout();
		});

		expect(result.current.checkoutError).toBe(
			'Confirme os termos para continuar.',
		);
		expect(startCheckoutAction).not.toHaveBeenCalled();
	});

	it('redirects to the returned checkout URL after a successful checkout', async () => {
		const redirectToCheckout = jest.fn();
		(startCheckoutAction as jest.Mock).mockResolvedValue({
			checkoutUrl: 'https://checkout.example.com/pay',
		});

		const orderInput = createInitialCheckoutInput();
		const { result } = renderHook(() =>
			useCheckoutSubmit({
				hasAcceptedTerms: true,
				orderInput,
				redirectToCheckout,
			}),
		);

		act(() => {
			result.current.handleCheckout();
		});

		await waitFor(() => {
			expect(startCheckoutAction).toHaveBeenCalledWith(orderInput);
		});
		await waitFor(() => {
			expect(redirectToCheckout).toHaveBeenCalledWith(
				'https://checkout.example.com/pay',
			);
		});
		expect(result.current.checkoutError).toBeNull();
	});

	it('keeps the user on the page when checkout returns an error', async () => {
		const redirectToCheckout = jest.fn();
		(startCheckoutAction as jest.Mock).mockResolvedValue({
			error: 'Não foi possível iniciar o checkout.',
		});

		const { result } = renderHook(() =>
			useCheckoutSubmit({
				hasAcceptedTerms: true,
				orderInput: createInitialCheckoutInput(),
				redirectToCheckout,
			}),
		);

		act(() => {
			result.current.handleCheckout();
		});

		await waitFor(() => {
			expect(result.current.checkoutError).toBe(
				'Não foi possível iniciar o checkout.',
			);
		});
		expect(redirectToCheckout).not.toHaveBeenCalled();
	});
});
