import { GlitchLogo } from '@packages/ui/brand/glitch-logo';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { logoutAction } from '@/modules/auth/actions/auth-actions';
import { DashboardNavigation } from './dashboard-navigation';

type DashboardShellProps = {
	children: ReactNode;
	user: {
		username: string;
	};
};

export const DashboardShell = ({ children, user }: DashboardShellProps) => {
	return (
		<div className="flex min-h-screen bg-background text-white">
			<aside className="fixed left-0 top-0 bottom-0 w-[240px] border-r border-white/5 bg-background z-50 flex flex-col">
				<div className="p-8 pb-10">
					<Link href="/" aria-label="Voltar para a página inicial">
						<GlitchLogo />
					</Link>
				</div>

				<DashboardNavigation />

				<div className="p-4 mt-auto">
					<div className="bg-white/5 rounded-sm p-4 border border-white/5">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-8 h-8 rounded-sm bg-hextech-cyan/20 flex items-center justify-center border border-hextech-cyan/20">
								<User className="w-4 h-4 text-hextech-cyan" />
							</div>
							<div className="overflow-hidden">
								<p className="text-[10px] font-black uppercase tracking-widest text-white truncate">
									{user.username}
								</p>
								<p className="text-[8px] font-medium text-white/40 uppercase tracking-widest truncate">
									CLIENTE
								</p>
							</div>
						</div>
						<form action={logoutAction}>
							<button
								type="submit"
								className="cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors w-full"
							>
								<LogOut className="w-3 h-3" />
								Sair
							</button>
						</form>
					</div>
				</div>
			</aside>

			<main className="flex-1 ml-[240px] relative">
				<header className="h-20 border-b border-white/5 flex items-center px-10 justify-between sticky top-0 bg-background/80 z-40">
					<h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
						EloNew / <span className="text-white">Portal do Cliente</span>
					</h1>
					<div className="text-right">
						<p className="text-[8px] font-medium text-white/40 uppercase tracking-widest">
							Status do Sistema
						</p>
						<div className="flex items-center gap-1.5 justify-end">
							<div className="w-1 h-1 bg-emerald-500 rounded-full" />
							<p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
								Online
							</p>
						</div>
					</div>
				</header>

				<div className="p-10">{children}</div>
			</main>
		</div>
	);
};
