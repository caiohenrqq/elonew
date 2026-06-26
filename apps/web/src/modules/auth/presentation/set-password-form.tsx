'use client';

import { KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { setPasswordAction } from '../actions/auth-actions';
import type { SetPasswordFormInput } from '../model/auth-schemas';
import { AuthErrorText, AuthField, AuthSuccessText } from './auth-form-fields';

export const SetPasswordForm = ({ token }: { token: string }) => {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [isPending, startTransition] = useTransition();
	const form = useForm<SetPasswordFormInput>({
		defaultValues: {
			token,
			password: '',
		},
	});

	const onSubmit = form.handleSubmit((values) => {
		setError(null);
		startTransition(async () => {
			const result = await setPasswordAction(values);
			if (result.error) {
				setError(result.error);
				return;
			}
			setSuccess(true);
			window.setTimeout(() => router.push('/login'), 1500);
		});
	});

	return (
		<form onSubmit={onSubmit} className="space-y-5">
			<input type="hidden" {...form.register('token')} />
			<div className="space-y-2 text-center">
				<h1 className="text-xl font-black uppercase tracking-[0.22em] text-white">
					Definir senha
				</h1>
				<p className="text-[10px] uppercase tracking-widest leading-relaxed text-white/40">
					Crie sua senha para ativar o acesso.
				</p>
			</div>
			<AuthField
				id="password"
				type="password"
				label="Senha"
				icon={KeyRound}
				autoComplete="new-password"
				error={form.formState.errors.password?.message}
				{...form.register('password')}
			/>
			{error ? <AuthErrorText>{error}</AuthErrorText> : null}
			{success ? (
				<AuthSuccessText>Senha definida. Redirecionando...</AuthSuccessText>
			) : null}
			<button
				type="submit"
				disabled={isPending || success}
				className="w-full rounded-sm bg-hextech-cyan px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-background transition-colors hover:bg-white disabled:opacity-60"
			>
				{isPending ? 'Salvando' : 'Ativar conta'}
			</button>
		</form>
	);
};
