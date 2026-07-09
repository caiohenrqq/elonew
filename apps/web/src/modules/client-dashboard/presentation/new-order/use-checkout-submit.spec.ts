import { act, renderHook, waitFor } from '@testing-library/react';
import { startCheckoutAction } from '../../actions/order-actions';
import { createInitialCheckoutInput } from '../../model/checkout-defaults';
import { useCheckoutSubmit } from './use-checkout-submit';

jest.mock('../../actions/order-actions', () => ({
	startCheckoutAction: jest.fn(),
}));

const routerPush = jest.fn();

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: routerPush }),
}));

const makeCheckoutTab = () => ({
	close: jest.fn(),
	location: { href: '' } as Location,
});

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

	it('opens checkout in a new tab and sends the current tab to the order page', async () => {
		const checkoutTab = makeCheckoutTab();
		(startCheckoutAction as jest.Mock).mockResolvedValue({
			checkoutUrl: 'https://checkout.example.com/pay',
			orderId: 'order-1',
		});

		const orderInput = createInitialCheckoutInput();
		const { result } = renderHook(() =>
			useCheckoutSubmit({
				hasAcceptedTerms: true,
				orderInput,
				openCheckoutTab: () => checkoutTab,
			}),
		);

		act(() => {
			result.current.handleCheckout();
		});

		await waitFor(() => {
			expect(startCheckoutAction).toHaveBeenCalledWith(orderInput);
		});
		await waitFor(() => {
			expect(checkoutTab.location.href).toBe(
				'https://checkout.example.com/pay',
			);
		});
		expect(routerPush).toHaveBeenCalledWith('/client/orders/order-1');
		expect(result.current.checkoutError).toBeNull();
	});

	it('falls back to a same-tab redirect when the popup is blocked', async () => {
		const redirectToCheckout = jest.fn();
		(startCheckoutAction as jest.Mock).mockResolvedValue({
			checkoutUrl: 'https://checkout.example.com/pay',
			orderId: 'order-1',
		});

		const { result } = renderHook(() =>
			useCheckoutSubmit({
				hasAcceptedTerms: true,
				orderInput: createInitialCheckoutInput(),
				redirectToCheckout,
				openCheckoutTab: () => null,
			}),
		);

		act(() => {
			result.current.handleCheckout();
		});

		await waitFor(() => {
			expect(redirectToCheckout).toHaveBeenCalledWith(
				'https://checkout.example.com/pay',
			);
		});
		expect(routerPush).not.toHaveBeenCalled();
	});

	it('closes the checkout tab and keeps the user on the page when checkout fails', async () => {
		const checkoutTab = makeCheckoutTab();
		const redirectToCheckout = jest.fn();
		(startCheckoutAction as jest.Mock).mockResolvedValue({
			error: 'Não foi possível iniciar o checkout.',
		});

		const { result } = renderHook(() =>
			useCheckoutSubmit({
				hasAcceptedTerms: true,
				orderInput: createInitialCheckoutInput(),
				redirectToCheckout,
				openCheckoutTab: () => checkoutTab,
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
		expect(checkoutTab.close).toHaveBeenCalled();
		expect(redirectToCheckout).not.toHaveBeenCalled();
	});
});
