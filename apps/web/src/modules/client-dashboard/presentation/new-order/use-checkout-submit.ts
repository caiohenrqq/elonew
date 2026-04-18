'use client';

import { useCallback, useState, useTransition } from 'react';
import { startCheckoutAction } from '../../actions/order-actions';
import type { StartCheckoutInput } from '../../server/order-contracts';

type UseCheckoutSubmitInput = {
	hasAcceptedTerms: boolean;
	orderInput: StartCheckoutInput;
	redirectToCheckout?: (checkoutUrl: string) => void;
};

const defaultRedirectToCheckout = (checkoutUrl: string) => {
	window.location.assign(checkoutUrl);
};

export const useCheckoutSubmit = ({
	hasAcceptedTerms,
	orderInput,
	redirectToCheckout = defaultRedirectToCheckout,
}: UseCheckoutSubmitInput) => {
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleCheckout = useCallback(() => {
		if (!hasAcceptedTerms) {
			setCheckoutError('Confirme os termos para continuar.');
			return;
		}

		setCheckoutError(null);
		startTransition(async () => {
			const result = await startCheckoutAction(orderInput);
			if (result.error) {
				setCheckoutError(result.error);
				return;
			}

			if (result.checkoutUrl) redirectToCheckout(result.checkoutUrl);
		});
	}, [hasAcceptedTerms, orderInput, redirectToCheckout]);

	return {
		checkoutError,
		handleCheckout,
		isPending,
	};
};
