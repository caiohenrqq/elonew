'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/shared/ui/components/button';
import {
	type RevealCredentialsActionState,
	revealBoosterOrderCredentialsAction,
} from '../../actions/booster-actions';
import type { OrderCredentialsOutput } from '../../server/booster-contracts';

const fields: Array<[keyof OrderCredentialsOutput, string]> = [
	['login', 'Login'],
	['summonerName', 'Invocador'],
	['password', 'Senha'],
];

export const OrderCredentialsCard = ({ orderId }: { orderId: string }) => {
	const [credentials, setCredentials] = useState<OrderCredentialsOutput | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const reveal = () => {
		setError(null);
		startTransition(async () => {
			const result: RevealCredentialsActionState =
				await revealBoosterOrderCredentialsAction(orderId);
			if (!result.credentials)
				return setError(result.error ?? 'Credenciais indisponíveis.');
			setCredentials(result.credentials);
		});
	};

	return (
		<div className="rounded-sm border border-hextech-cyan/25 bg-hextech-cyan/[0.04] p-5 sm:col-span-3 xl:col-span-1">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[9px] font-black uppercase tracking-widest text-hextech-cyan">
					Credenciais da conta
				</p>
				<Button
					size="sm"
					variant="outline"
					disabled={isPending}
					onClick={credentials ? () => setCredentials(null) : reveal}
				>
					{credentials
						? 'Ocultar credenciais'
						: isPending
							? 'Revelando...'
							: 'Revelar credenciais'}
				</Button>
			</div>
			{credentials ? (
				<dl className="mt-4 space-y-3">
					{fields.map(([key, label]) => (
						<div key={key} className="min-w-0">
							<dt className="text-[9px] font-bold uppercase tracking-wider text-white/35">
								{label}
							</dt>
							<dd className="mt-1 flex items-center gap-2">
								<code className="min-w-0 flex-1 break-all text-xs text-white">
									{credentials[key]}
								</code>
								<button
									type="button"
									className="text-[9px] font-black uppercase tracking-wider text-hextech-cyan hover:text-white"
									onClick={() =>
										navigator.clipboard.writeText(credentials[key])
									}
								>
									Copiar {label.toLowerCase()}
								</button>
							</dd>
						</div>
					))}
				</dl>
			) : (
				<p className="mt-3 text-xs leading-relaxed text-white/45">
					Ocultas por segurança. Cada revelação é auditada.
				</p>
			)}
			{error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
		</div>
	);
};
