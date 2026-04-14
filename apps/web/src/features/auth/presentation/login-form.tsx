'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { Button } from '@packages/ui/components/button';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { loginAction } from '@/features/auth/actions/auth-actions';
import { type LoginFormInput, loginFormSchema } from '../model/auth-schemas';
import {
	AuthCheckboxField,
	AuthErrorText,
	AuthField,
	AuthSwitchLink,
} from './auth-form-fields';

export const LoginForm = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const form = useForm<LoginFormInput>({
		resolver: zodResolver(loginFormSchema),
		defaultValues: {
			email: '',
			password: '',
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

	const handleSubmit = form.handleSubmit((values) => {
		setFormError(null);
		startTransition(async () => {
			const result = await loginAction(values);
			if (result?.error) setFormError(result.error);
		});
	});

	return (
		<div ref={containerRef} className="space-y-8">
			<div className="auth-animate space-y-2 text-center">
				<h1 className="text-xl font-black uppercase tracking-[0.2em] text-white">
					Acesse sua Conta
				</h1>
				<p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
					Entre para gerenciar seus pedidos e acompanhar sua subida.
				</p>
			</div>

			<form className="space-y-6" onSubmit={handleSubmit}>
				<div className="space-y-4">
					<div className="auth-animate">
						<AuthField
							id="email"
							type="email"
							label="E-mail"
							icon={Mail}
							autoComplete="email"
							placeholder="exemplo@elonew.com"
							error={form.formState.errors.email?.message}
							{...form.register('email')}
						/>
					</div>

					<div className="auth-animate">
						<AuthField
							id="password"
							type="password"
							label="Senha"
							icon={Lock}
							autoComplete="current-password"
							placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
							error={form.formState.errors.password?.message}
							labelAction={
								<Link
									href="/forgot-password"
									className="text-[9px] text-white/20 hover:text-white focus-visible:text-white focus-visible:outline-none uppercase font-black transition-colors"
								>
									Esqueceu a senha?
								</Link>
							}
							{...form.register('password')}
						/>
					</div>
				</div>

				{formError ? <AuthErrorText>{formError}</AuthErrorText> : null}

				<div className="auth-animate">
					<AuthCheckboxField id="remember" name="remember">
						Lembrar nesta sessão
					</AuthCheckboxField>
				</div>

				<motion.div
					className="auth-animate"
					whileHover={{ scale: 1.01 }}
					whileTap={{ scale: 0.99 }}
				>
					<Button
						type="submit"
						className="w-full h-12 uppercase tracking-widest font-black hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all"
						disabled={isPending}
					>
						{isPending ? 'Entrando...' : 'Entrar Agora'}
						<ShieldCheck className="ml-2 w-4 h-4" />
					</Button>
				</motion.div>
			</form>

			<div className="auth-animate pt-6 border-t border-white/5 text-center space-y-4">
				<p className="text-[10px] text-white/20 uppercase tracking-widest font-black">
					Ainda não é um cliente?
				</p>
				<AuthSwitchLink href="/register">Criar uma Nova Conta</AuthSwitchLink>
			</div>
		</div>
	);
};
