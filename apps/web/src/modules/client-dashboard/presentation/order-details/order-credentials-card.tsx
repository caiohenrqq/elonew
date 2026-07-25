'use client';

import { ShieldCheck } from 'lucide-react';
import { useActionState, useState } from 'react';
import { DashboardSubmitButton } from '@/shared/dashboard/dashboard-submit-button';
import { Input } from '@/shared/ui/components/input';
import { Label } from '@/shared/ui/components/label';
import { PasswordField } from '@/shared/ui/components/password-field';
import { cn } from '@/shared/ui/utils/cn';
import type { SaveOrderCredentialsActionState } from '../../actions/order-actions';

type OrderCredentialsCardProps = {
	action: (
		state: SaveOrderCredentialsActionState,
		formData: FormData,
	) => Promise<SaveOrderCredentialsActionState>;
	summonerName: string;
};

export const OrderCredentialsCard = ({
	action,
	summonerName,
}: OrderCredentialsCardProps) => {
	const [state, formAction] = useActionState(action, {});
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [hasTouchedConfirmation, setHasTouchedConfirmation] = useState(false);
	const passwordsMatch = password === confirmPassword;

	if (state.success) {
		return (
			<div className="flex items-center gap-3 rounded-sm border border-emerald-400/25 bg-emerald-400/5 px-4 py-3">
				<ShieldCheck
					className="h-4 w-4 shrink-0 text-emerald-300"
					aria-hidden="true"
				/>
				<p className="text-xs font-bold tracking-wider text-emerald-300">
					{state.success} Os dados ficam criptografados e são apagados quando o
					pedido termina.
				</p>
			</div>
		);
	}

	return (
		<section className="rounded-sm border border-hextech-gold/25 bg-hextech-gold/5 p-5 sm:p-6">
			<div className="flex items-center gap-2 text-hextech-gold">
				<ShieldCheck className="h-5 w-5" aria-hidden="true" />
				<h2 className="text-sm font-black uppercase tracking-widest">
					Dados de acesso da conta
				</h2>
			</div>
			<p className="mt-3 text-xs leading-relaxed text-white/60">
				O pagamento foi confirmado. Envie o acesso da conta que receberá o boost
				— os dados são criptografados e apagados assim que o pedido termina.
			</p>

			<form action={formAction} className="mt-6 grid gap-6">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div className="space-y-3">
						<Label htmlFor="credentials-login">
							Login <span aria-hidden="true">*</span>
						</Label>
						<Input
							id="credentials-login"
							name="login"
							autoComplete="off"
							maxLength={64}
							aria-describedby="credentials-login-help"
							className="h-12 text-base md:text-sm"
							required
						/>
						<p id="credentials-login-help" className="text-sm text-white/55">
							O login usado para entrar na conta.
						</p>
					</div>
					<div className="space-y-3">
						<Label htmlFor="credentials-summoner-name">
							Nome de invocador <span aria-hidden="true">*</span>
						</Label>
						<Input
							id="credentials-summoner-name"
							name="summonerName"
							defaultValue={summonerName}
							autoComplete="off"
							maxLength={64}
							className="h-12 text-base md:text-sm"
							required
						/>
					</div>
					<PasswordField
						id="credentials-password"
						name="password"
						label="Senha"
						value={password}
						onChange={setPassword}
						description="Use entre 8 e 128 caracteres."
					/>
					<PasswordField
						id="credentials-password-confirmation"
						name="confirmPassword"
						label="Confirmar senha"
						value={confirmPassword}
						onChange={setConfirmPassword}
						onBlur={() => setHasTouchedConfirmation(true)}
						description="Repita a senha."
						error={
							hasTouchedConfirmation && !passwordsMatch
								? 'As senhas não coincidem.'
								: undefined
						}
					/>
				</div>

				<div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
					<p
						className={cn(
							'min-h-4 text-xs font-medium',
							state.error ? 'text-red-300' : 'text-white/45',
						)}
					>
						{state.error ??
							'Recomendamos usar uma senha nova e trocá-la ao fim do boost.'}
					</p>

					<DashboardSubmitButton
						className="h-10 w-full sm:w-auto"
						pendingLabel="Enviando"
						disabled={!passwordsMatch}
					>
						<ShieldCheck className="h-3 w-3" />
						Enviar acesso
					</DashboardSubmitButton>
				</div>
			</form>
		</section>
	);
};
