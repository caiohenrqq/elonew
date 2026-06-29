'use client';

import { useEffect, useRef, useState } from 'react';
import { previewOrderQuoteAction } from '../../actions/order-actions';
import type {
	OrderQuotePreviewOutput,
	StartCheckoutInput,
} from '../../server/order-contracts';

const quotePreviewDebounceMs = 300;
const quotePreviewFallbackError = 'Não foi possível calcular o pedido.';

export const useQuotePreview = (
	orderInput: StartCheckoutInput,
	refreshKey = 0,
) => {
	const [quotePreview, setQuotePreview] =
		useState<OrderQuotePreviewOutput | null>(null);
	const [quotePreviewError, setQuotePreviewError] = useState<string | null>(
		null,
	);
	const [isQuotePreviewPending, setIsQuotePreviewPending] = useState(false);
	const previewRequestId = useRef(0);
	const {
		couponCode,
		currentDivision,
		currentLeague,
		currentLp,
		deadline,
		desiredDivision,
		desiredLeague,
		desiredQueue,
		extras,
		lpGain,
		paymentMethod,
		server,
		serviceType,
	} = orderInput;

	// biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is an explicit re-apply trigger, not read in the effect.
	useEffect(() => {
		const requestId = ++previewRequestId.current;
		let isCancelled = false;
		const previewInput: StartCheckoutInput = {
			couponCode,
			currentDivision,
			currentLeague,
			currentLp,
			deadline,
			desiredDivision,
			desiredLeague,
			desiredQueue,
			extras,
			lpGain,
			paymentMethod,
			server,
			serviceType,
		};

		setIsQuotePreviewPending(true);

		const timeoutId = window.setTimeout(async () => {
			try {
				const result = await previewOrderQuoteAction(previewInput);

				if (isCancelled || previewRequestId.current !== requestId) return;

				if ('error' in result) {
					// Keep the last good price so an invalid coupon surfaces an error
					// without wiping the amount the client was already seeing.
					setQuotePreviewError(result.error ?? quotePreviewFallbackError);
				} else {
					setQuotePreview(result.quote);
					setQuotePreviewError(null);
				}
			} catch {
				if (isCancelled || previewRequestId.current !== requestId) return;

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
	}, [
		couponCode,
		currentDivision,
		currentLeague,
		currentLp,
		deadline,
		desiredDivision,
		desiredLeague,
		desiredQueue,
		extras,
		lpGain,
		paymentMethod,
		server,
		serviceType,
		refreshKey,
	]);

	return {
		isQuotePreviewPending,
		quotePreview,
		quotePreviewError,
	};
};
