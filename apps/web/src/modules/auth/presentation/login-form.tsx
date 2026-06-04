'use client';

import type { DevUserRole } from '@packages/shared/testing/dev-users';
import { Lock, Mail, ShieldCheck, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import {
	devLoginAction,
	loginAction,
} from '@/modules/auth/actions/auth-actions';
import { gsap, useGSAP } from '@/shared/ui/animation/gsap';
import { Button } from '@/shared/ui/components/button';
import type { LoginFormInput } from '../model/auth-schemas';
import {
	AuthCheckboxField,
	AuthErrorText,
	AuthField,
	AuthSwitchLink,
} from './auth-form-fields';

const devLoginOptions = [
	{ role: 'CLIENT', label: 'Cliente', email: 'client@elojob.com' },
	{ role: 'BOOSTER', label: 'Booster', email: 'booster@elojob.com' },
	{ role: 'ADMIN', label: 'Admin', email: 'admin@elojob.com' },
] as const satisfies readonly {
	role: DevUserRole;
	label: string;
	email: string;
}[];

type LoginFormProps = {
	showDevLogin?: boolean;
};

export const LoginForm = ({ showDevLogin = false }: LoginFormProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isDevLoginOpen, setIsDevLoginOpen] = useState(false);
	const [devLoginRole, setDevLoginRole] = useState<DevUserRole | null>(null);
	const [isPending, startTransition] = useTransition();
	const form = useForm<LoginFormInput>({
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

	const handleDevLogin = (role: DevUserRole) => {
		setFormError(null);
		setDevLoginRole(role);
		startTransition(async () => {
			const result = await devLoginAction(role);
			if (result?.error) {
				setDevLoginRole(null);
				setFormError(result.error);
			}
		});
	};

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

			<form className="space-y-6" noValidate onSubmit={handleSubmit}>
				<div className="space-y-4">
					<div className="auth-animate">
						<AuthField
							id="email"
							type="email"
							label="E-mail"
							icon={Mail}
							autoComplete="email"
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
							autoComplete="current-password"
							placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
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

				<motion.div className="auth-animate">
					<Button
						type="submit"
						className="h-12 w-full font-black uppercase tracking-widest"
						disabled={isPending}
					>
						{isPending ? 'Entrando...' : 'Entrar Agora'}
						<ShieldCheck className="ml-2 w-4 h-4" />
					</Button>
				</motion.div>
			</form>

			{showDevLogin ? (
				<div className="auth-animate absolute bottom-4 left-4 z-20">
					<button
						type="button"
						aria-label="Open development login shortcuts"
						aria-expanded={isDevLoginOpen}
						className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/70 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-black/40 backdrop-blur transition-colors hover:border-hextech-cyan/40 hover:text-hextech-cyan focus-visible:border-hextech-cyan/40 focus-visible:text-hextech-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan"
						onClick={() => setIsDevLoginOpen((current) => !current)}
					>
						<Terminal className="h-4 w-4" />
					</button>
					{isDevLoginOpen ? (
						<div className="absolute bottom-11 left-0 w-56">
							<div className="overflow-hidden rounded-sm border border-hextech-cyan/20 bg-[#090d12] text-white shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
								<div className="h-px bg-gradient-to-r from-transparent via-hextech-cyan to-transparent" />
								<div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(245,158,11,0.05)_45%,rgba(255,255,255,0.02))] px-3 py-2">
									<p className="text-[8px] font-black uppercase tracking-[0.28em] text-hextech-gold">
										Local environment
									</p>
									<p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
										Development login
									</p>
								</div>
								<div className="grid gap-1.5 bg-black/20 p-2">
									{devLoginOptions.map((option) => (
										<Button
											key={option.role}
											type="button"
											variant="outline"
											className="h-auto min-h-10 flex-col items-start gap-1 border-white/10 bg-white/[0.03] px-3 py-2 text-left tracking-[0.12em] hover:border-hextech-cyan/30 hover:bg-hextech-cyan/10"
											disabled={isPending}
											onClick={() => handleDevLogin(option.role)}
										>
											<span className="text-[10px]">
												{devLoginRole === option.role
													? 'Entrando...'
													: option.label}
											</span>
											<span className="max-w-full truncate text-[8px] text-white/35 normal-case tracking-normal">
												{option.email}
											</span>
										</Button>
									))}
								</div>
							</div>
						</div>
					) : null}
				</div>
			) : null}

			<div className="auth-animate pt-6 border-t border-white/5 text-center space-y-4">
				<p className="text-[10px] text-white/20 uppercase tracking-widest font-black">
					Ainda não é um cliente?
				</p>
				<AuthSwitchLink href="/register">Criar uma Nova Conta</AuthSwitchLink>
			</div>
		</div>
	);
};
