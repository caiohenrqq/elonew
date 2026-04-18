'use client';

import { useEffect, useRef, useState } from 'react';
import { previewOrderQuoteAction } from '../../actions/order-actions';
import type {
	OrderQuotePreviewOutput,
	StartCheckoutInput,
} from '../../server/order-contracts';

const quotePreviewDebounceMs = 300;
const quotePreviewFallbackError = 'Não foi possível calcular o pedido.';

export const useQuotePreview = (orderInput: StartCheckoutInput) => {
	const [quotePreview, setQuotePreview] =
		useState<OrderQuotePreviewOutput | null>(null);
	const [quotePreviewError, setQuotePreviewError] = useState<string | null>(
		null,
	);
	const [isQuotePreviewPending, setIsQuotePreviewPending] = useState(false);
	const previewRequestId = useRef(0);

	useEffect(() => {
		const requestId = ++previewRequestId.current;
		let isCancelled = false;

		setIsQuotePreviewPending(true);

		const timeoutId = window.setTimeout(async () => {
			try {
				const result = await previewOrderQuoteAction(orderInput);

				if (isCancelled || previewRequestId.current !== requestId) return;

				if ('error' in result) {
					setQuotePreview(null);
					setQuotePreviewError(result.error ?? quotePreviewFallbackError);
				} else {
					setQuotePreview(result.quote);
					setQuotePreviewError(null);
				}
			} catch {
				if (isCancelled || previewRequestId.current !== requestId) return;

				setQuotePreview(null);
				setQuotePreviewError(quotePreviewFallbackError);
			} finally {
				if (!isCancelled && previewRequestId.current === requestId) {
					setIsQuotePreviewPending(false);
				}
			}
		}, quotePreviewDebounceMs);

		return () => {
			isCancelled = true;
			window.clearTimeout(timeoutId);
		};
	}, [orderInput]);

	return {
		isQuotePreviewPending,
		quotePreview,
		quotePreviewError,
	};
};
