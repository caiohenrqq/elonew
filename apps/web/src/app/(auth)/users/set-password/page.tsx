import Link from 'next/link';
import { SetPasswordForm } from '@/modules/auth/presentation/set-password-form';
import { getButtonClassName } from '@/shared/ui/components/button';

type SetPasswordPageProps = {
	searchParams: Promise<{ token?: string }>;
};

export default async function SetPasswordPage({
	searchParams,
}: SetPasswordPageProps) {
	const { token } = await searchParams;

	if (!token) {
		return (
			<div className="text-center space-y-6 py-8">
				<h1 className="text-xl font-black uppercase tracking-[0.22em] text-white">
					Link inválido
				</h1>
				<p className="text-[10px] uppercase tracking-widest leading-relaxed text-white/40">
					Solicite um novo e-mail de acesso para definir sua senha.
				</p>
				<Link
					href="/login"
					className={getButtonClassName({
						variant: 'outline',
						size: 'md',
						className:
							'w-full text-[10px] font-black uppercase tracking-[0.2em]',
					})}
				>
					Voltar para o login
				</Link>
			</div>
		);
	}

	return <SetPasswordForm token={token} />;
}
