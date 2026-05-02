'use client';

import { Button } from '@packages/ui/components/button';
import { Input } from '@packages/ui/components/input';
import { Label } from '@packages/ui/components/label';
import { WalletCards } from 'lucide-react';
import { useActionState } from 'react';
import { requestBoosterWithdrawalAction } from '../../actions/booster-actions';

type WithdrawalFormProps = {
	maxAmount: number;
};

export const WithdrawalForm = ({ maxAmount }: WithdrawalFormProps) => {
	const [state, formAction, isPending] = useActionState(
		requestBoosterWithdrawalAction,
		{},
	);

	return (
		<form action={formAction} className="space-y-3">
			<div className="space-y-2">
				<Label htmlFor="withdrawal-amount">Valor do saque</Label>
				<Input
					id="withdrawal-amount"
					name="amount"
					type="number"
					min="0.01"
					max={maxAmount}
					step="0.01"
					placeholder="0,00"
					disabled={maxAmount <= 0 || isPending}
				/>
			</div>
			<Button
				type="submit"
				variant="secondary"
				size="sm"
				className="w-full gap-2"
				disabled={maxAmount <= 0 || isPending}
			>
				<WalletCards className="h-3 w-3" />
				Solicitar saque
			</Button>
			{state.error ? (
				<p className="text-[10px] font-bold text-danger">{state.error}</p>
			) : null}
			{state.success ? (
				<p className="text-[10px] font-bold text-success">
					Solicitação enviada.
				</p>
			) : null}
		</form>
	);
};
