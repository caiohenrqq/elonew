'use client';

import { CreditCard } from 'lucide-react';
import { useCallback, useState, useTransition } from 'react';
import { getButtonClassName } from '@/shared/ui/components/button';
import { resumePaymentCheckoutAction } from '../../actions/order-actions';

type CheckoutTab = Pick<Window, 'close' | 'location'>;

type ResumePaymentButtonProps = {
	orderId: string;
	openCheckoutTab?: () => CheckoutTab | null;
};

const defaultOpenCheckoutTab = () => window.open('', '_blank');

export const ResumePaymentButton = ({
	orderId,
	openCheckoutTab = defaultOpenCheckoutTab,
}: ResumePaymentButtonProps) => {
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleResume = useCallback(() => {
		setError(null);
		const checkoutTab = openCheckoutTab();
		startTransition(async () => {
			const result = await resumePaymentCheckoutAction(orderId);
			if (result.error || !result.checkoutUrl) {
				checkoutTab?.close();
				setError(result.error ?? 'Não foi possível iniciar o pagamento.');
				return;
			}

			if (checkoutTab) {
				checkoutTab.location.href = result.checkoutUrl;
				return;
			}

			window.location.assign(result.checkoutUrl);
		});
	}, [orderId, openCheckoutTab]);

	return (
		<div className="space-y-2">
			<button
				type="button"
				onClick={handleResume}
				disabled={isPending}
				className={getButtonClassName({
					size: 'sm',
					className: 'gap-2 font-black uppercase tracking-widest',
				})}
			>
				<CreditCard className="h-3.5 w-3.5" />
				{isPending ? 'Abrindo pagamento' : 'Retomar pagamento'}
			</button>
			{error ? (
				<p className="max-w-64 text-[10px] font-bold leading-4 text-danger">
					{error}
				</p>
			) : null}
		</div>
	);
};
