'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, useTransition } from 'react';
import { confirmEmailAction } from '@/modules/auth/actions/auth-actions';
import { AuthSuccessText } from '@/modules/auth/presentation/auth-form-fields';
import { getButtonClassName } from '@/shared/ui/components/button';

const REDIRECT_DELAY_MS = 3000;
const MISSING_TOKEN_MESSAGE =
	'O link de confirmação está incompleto. Solicite um novo cadastro para receber outro e-mail.';

type ConfirmEmailStatus = 'loading' | 'success' | 'error';

const ConfirmEmailLoading = () => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		className="space-y-4"
	>
		<Loader2 className="w-12 h-12 text-hextech-gold animate-spin mx-auto" />
		<h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">
			Confirmando seu e-mail
		</h2>
		<p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
			Aguarde um momento enquanto validamos sua conta.
		</p>
	</motion.div>
);

const ConfirmEmailContent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');
	const [status, setStatus] = useState<ConfirmEmailStatus>('loading');
	const [errorMessage, setErrorMessage] = useState(MISSING_TOKEN_MESSAGE);
	const [isPending, startTransition] = useTransition();
	const hasRequestedRef = useRef(false);

	useEffect(() => {
		if (hasRequestedRef.current) return;
		hasRequestedRef.current = true;

		if (!token) {
			setStatus('error');
			setErrorMessage(MISSING_TOKEN_MESSAGE);
			return;
		}

		startTransition(async () => {
			const result = await confirmEmailAction(token);
			if (result.success) {
				setStatus('success');
				return;
			}

			setStatus('error');
			if (result.error) setErrorMessage(result.error);
		});
	}, [token]);

	useEffect(() => {
		if (status !== 'success') return;

		const redirectTimeout = window.setTimeout(() => {
			router.push('/login?confirmed=true');
		}, REDIRECT_DELAY_MS);

		return () => window.clearTimeout(redirectTimeout);
	}, [status, router]);

	if (status === 'loading' || isPending) return <ConfirmEmailLoading />;

	if (status === 'success') {
		return (
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: 'spring', stiffness: 200, damping: 20 }}
				className="space-y-6"
			>
				<div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
					<CheckCircle2 className="w-8 h-8 text-emerald-500" />
				</div>
				<div className="space-y-2">
					<h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">
						E-mail Confirmado!
					</h2>
					<p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
						Sua conta foi ativada com sucesso. Já pode acessar a EloNew.
					</p>
				</div>
				<AuthSuccessText>Redirecionando para o login...</AuthSuccessText>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{ type: 'spring', stiffness: 200, damping: 20 }}
			className="space-y-6"
		>
			<div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
				<XCircle className="w-8 h-8 text-red-500" />
			</div>
			<div className="space-y-2">
				<h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">
					Erro na Confirmação
				</h2>
				<p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
					{errorMessage}
				</p>
			</div>
			<div className="space-y-4 pt-2">
				<Link
					href="/register"
					className={getButtonClassName({
						variant: 'outline',
						size: 'md',
						className:
							'w-full text-[10px] font-black uppercase tracking-[0.2em]',
					})}
				>
					Criar uma nova conta
				</Link>
				<Link
					href="/login"
					className="block text-[10px] text-hextech-gold hover:text-white uppercase font-black tracking-widest transition-colors"
				>
					Voltar para o Login
				</Link>
			</div>
		</motion.div>
	);
};

export default function ConfirmEmailPage() {
	return (
		<div className="text-center space-y-6 py-8 min-h-[400px] flex flex-col items-center justify-center">
			<Suspense fallback={<ConfirmEmailLoading />}>
				<ConfirmEmailContent />
			</Suspense>
		</div>
	);
}
