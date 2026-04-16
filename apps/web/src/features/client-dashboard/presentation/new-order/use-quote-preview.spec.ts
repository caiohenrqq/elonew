import { act, renderHook, waitFor } from '@testing-library/react';
import { previewOrderQuoteAction } from '../../actions/order-actions';
import { createInitialCheckoutInput } from '../../model/checkout-defaults';
import { useQuotePreview } from './use-quote-preview';

jest.mock('../../actions/order-actions', () => ({
	previewOrderQuoteAction: jest.fn(),
}));

const flushPromiseQueue = async () => {
	await Promise.resolve();
	await Promise.resolve();
};

describe('useQuotePreview', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('debounces preview requests and exposes the calculated quote', async () => {
		const quote = {
			subtotal: 100,
			totalAmount: 90,
			discountAmount: 10,
			extras: [],
		};
		(previewOrderQuoteAction as jest.Mock).mockResolvedValue({ quote });

		const orderInput = createInitialCheckoutInput();
		const { result } = renderHook(() => useQuotePreview(orderInput));

		expect(result.current.isQuotePreviewPending).toBe(true);
		expect(previewOrderQuoteAction).not.toHaveBeenCalled();

		await act(async () => {
			jest.advanceTimersByTime(300);
			await flushPromiseQueue();
		});

		await waitFor(() => {
			expect(result.current.isQuotePreviewPending).toBe(false);
		});
		expect(result.current.quotePreview).toEqual(quote);
		expect(result.current.quotePreviewError).toBeNull();
	});

	it('ignores stale preview responses after input changes', async () => {
		let resolveFirstPreview: (value: unknown) => void = () => undefined;
		const firstPreview = new Promise((resolve) => {
			resolveFirstPreview = resolve;
		});
		const latestQuote = {
			subtotal: 120,
			totalAmount: 120,
			discountAmount: 0,
			extras: [],
		};

		(previewOrderQuoteAction as jest.Mock)
			.mockReturnValueOnce(firstPreview)
			.mockResolvedValueOnce({ quote: latestQuote });

		const initialInput = createInitialCheckoutInput();
		const { rerender, result } = renderHook(
			({ orderInput }) => useQuotePreview(orderInput),
			{ initialProps: { orderInput: initialInput } },
		);

		await act(async () => {
			jest.advanceTimersByTime(300);
		});

		rerender({
			orderInput: {
				...initialInput,
				couponCode: 'ELOMAX30',
			},
		});

		await act(async () => {
			jest.advanceTimersByTime(300);
			await flushPromiseQueue();
		});

		await waitFor(() => {
			expect(result.current.quotePreview).toEqual(latestQuote);
		});

		await act(async () => {
			resolveFirstPreview({
				quote: {
					subtotal: 1,
					totalAmount: 1,
					discountAmount: 0,
					extras: [],
				},
			});
		});

		expect(result.current.quotePreview).toEqual(latestQuote);
	});

	it('clears pending state when preview request fails', async () => {
		(previewOrderQuoteAction as jest.Mock).mockRejectedValue(
			new Error('Preview failed'),
		);

		const orderInput = createInitialCheckoutInput();
		const { result } = renderHook(() => useQuotePreview(orderInput));

		await act(async () => {
			jest.advanceTimersByTime(300);
		});

		await waitFor(() => {
			expect(result.current.isQuotePreviewPending).toBe(false);
		});
		expect(result.current.quotePreview).toBeNull();
		expect(result.current.quotePreviewError).toBe(
			'Não foi possível calcular o pedido.',
		);
	});
});
