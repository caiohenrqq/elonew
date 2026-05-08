'use client';

import { getButtonClassName } from '@packages/ui/components/button';
import { CreditCard } from 'lucide-react';
import { useActionState } from 'react';
import { resumePaymentCheckoutAction } from '../../actions/order-actions';

type ResumePaymentButtonProps = {
	orderId: string;
};

export const ResumePaymentButton = ({ orderId }: ResumePaymentButtonProps) => {
	const [state, formAction, isPending] = useActionState(
		resumePaymentCheckoutAction.bind(null, orderId),
		{},
	);

	return (
		<form action={formAction} className="space-y-2">
			<button
				type="submit"
				disabled={isPending}
				className={getButtonClassName({
					size: 'sm',
					className: 'gap-2 font-black uppercase tracking-widest',
				})}
			>
				<CreditCard className="h-3.5 w-3.5" />
				{isPending ? 'Redirecionando' : 'Retomar pagamento'}
			</button>
			{state.error ? (
				<p className="max-w-64 text-[10px] font-bold leading-4 text-danger">
					{state.error}
				</p>
			) : null}
		</form>
	);
};
