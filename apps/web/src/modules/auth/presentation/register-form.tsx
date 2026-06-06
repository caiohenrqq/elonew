'use client';

import { CheckCircle2, Lock, Mail, User, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { registerAction } from '@/modules/auth/actions/auth-actions';
import { gsap, useGSAP } from '@/shared/ui/animation/gsap';
import { Button } from '@/shared/ui/components/button';
import type { RegisterFormInput } from '../model/auth-schemas';
import {
	AuthCheckboxField,
	AuthErrorText,
	AuthField,
	AuthSuccessText,
	AuthSwitchLink,
} from './auth-form-fields';

export const RegisterForm = () => {
	const router = useRouter();
	const containerRef = useRef<HTMLDivElement>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSuccess, setIsSuccess] = useState(false);
	const [isPending, startTransition] = useTransition();
	const form = useForm<RegisterFormInput>({
		defaultValues: {
			username: '',
			email: '',
			password: '',
			termsAccepted: false,
		},
	});

	useGSAP(
		() => {
			gsap.from('.auth-animate', {
				y: 20,
				opacity: 0,
				stagger: 0.1,
				duration: 0.8,
				ease: 'power3.out',
			});
		},
		{ scope: containerRef },
	);

	useEffect(() => {
		if (!isSuccess) return;

		const redirectTimeout = window.setTimeout(() => {
			router.push('/login');
		}, 3000);

		return () => window.clearTimeout(redirectTimeout);
	}, [isSuccess, router]);

	const handleSubmit = form.handleSubmit((values) => {
		setFormError(null);
		startTransition(async () => {
			const result = await registerAction(values);
			if (result?.error) {
				setFormError(result.error);
			} else if (result?.success) {
				setIsSuccess(true);
			}
		});
	});

	if (isSuccess) {
		return (
			<div className="text-center space-y-6 py-8">
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: 'spring', stiffness: 200, damping: 20 }}
					className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto"
				>
					<CheckCircle2 className="w-8 h-8 text-emerald-500" />
				</motion.div>

				<div className="space-y-2">
					<h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">
						Confirme seu e-mail
					</h2>
					<p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
						Enviamos um link de confirmação para o seu e-mail. Abra a mensagem e
						clique no link para ativar sua conta.
					</p>
				</div>

				<AuthSuccessText>Redirecionando para o login.</AuthSuccessText>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="space-y-8">
			<div className="auth-animate space-y-2 text-center">
				<h1 className="text-xl font-black uppercase tracking-[0.2em] text-white">
					Criar Conta
				</h1>
				<p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
					Junte-se à EloNew e comece sua jornada hoje.
				</p>
			</div>

			<form className="space-y-6" noValidate onSubmit={handleSubmit}>
				<div className="space-y-4">
					<div className="auth-animate">
						<AuthField
							id="username"
							type="text"
							label="Nome de usuário"
							icon={User}
							autoComplete="nickname"
							placeholder="Como devemos te chamar?"
							{...form.register('username')}
						/>
					</div>

					<div className="auth-animate">
						<AuthField
							id="email"
							type="email"
							label="E-mail"
							icon={Mail}
							autoComplete="username"
							placeholder="exemplo@elonew.com"
							{...form.register('email')}
						/>
					</div>

					<div className="auth-animate">
						<AuthField
							id="password"
							type="password"
							label="Senha"
							icon={Lock}
							autoComplete="new-password"
							placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
							{...form.register('password')}
						/>
					</div>
				</div>

				<div className="space-y-4">
					<div className="auth-animate">
						<AuthCheckboxField id="terms" {...form.register('termsAccepted')}>
							Eu li e aceito os{' '}
							<span className="text-white underline cursor-pointer">
								Termos de Uso
							</span>
						</AuthCheckboxField>
					</div>

					{formError ? <AuthErrorText>{formError}</AuthErrorText> : null}

					<motion.div className="auth-animate">
						<Button
							type="submit"
							className="h-12 w-full font-black uppercase tracking-widest"
							disabled={isPending}
						>
							{isPending ? 'Criando conta...' : 'Finalizar Cadastro'}
							<UserPlus className="ml-2 w-4 h-4" />
						</Button>
					</motion.div>
				</div>
			</form>

			<div className="auth-animate pt-6 border-t border-white/5 text-center space-y-4">
				<p className="text-[10px] text-white/20 uppercase tracking-widest font-black">
					Já possui uma conta?
				</p>
				<AuthSwitchLink href="/login">Acessar Minha Conta</AuthSwitchLink>
			</div>
		</div>
	);
};
