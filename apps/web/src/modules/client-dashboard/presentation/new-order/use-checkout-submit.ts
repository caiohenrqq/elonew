'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { startCheckoutAction } from '../../actions/order-actions';
import type { StartCheckoutInput } from '../../server/order-contracts';

type CheckoutTab = Pick<Window, 'close' | 'location'>;

type UseCheckoutSubmitInput = {
	hasAcceptedTerms: boolean;
	orderInput: StartCheckoutInput;
	redirectToCheckout?: (checkoutUrl: string) => void;
	openCheckoutTab?: () => CheckoutTab | null;
};

const defaultRedirectToCheckout = (checkoutUrl: string) => {
	window.location.assign(checkoutUrl);
};

const defaultOpenCheckoutTab = () => window.open('', '_blank');

export const useCheckoutSubmit = ({
	hasAcceptedTerms,
	orderInput,
	redirectToCheckout = defaultRedirectToCheckout,
	openCheckoutTab = defaultOpenCheckoutTab,
}: UseCheckoutSubmitInput) => {
	const router = useRouter();
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleCheckout = useCallback(() => {
		if (!hasAcceptedTerms) {
			setCheckoutError('Confirme os termos para continuar.');
			return;
		}

		setCheckoutError(null);
		const checkoutTab = openCheckoutTab();
		startTransition(async () => {
			const result = await startCheckoutAction(orderInput);
			if (result.error || !result.checkoutUrl) {
				checkoutTab?.close();
				setCheckoutError(
					result.error ?? 'Não foi possível iniciar o checkout.',
				);
				return;
			}

			if (checkoutTab) {
				checkoutTab.location.href = result.checkoutUrl;
				if (result.orderId) router.push(`/client/orders/${result.orderId}`);
				return;
			}

			redirectToCheckout(result.checkoutUrl);
		});
	}, [
		hasAcceptedTerms,
		orderInput,
		redirectToCheckout,
		openCheckoutTab,
		router,
	]);

	return {
		checkoutError,
		handleCheckout,
		isPending,
	};
};
