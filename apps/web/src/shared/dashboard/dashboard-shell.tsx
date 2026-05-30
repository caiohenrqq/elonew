import { LogOut } from 'lucide-react';
import Link from 'next/link';
import type { ElementType, ReactNode } from 'react';
import { GlitchLogo } from '@/shared/ui/brand/glitch-logo';
import { DashboardSubmitButton } from './dashboard-submit-button';

type DashboardShellProps = {
	children: ReactNode;
	headerAside: ReactNode;
	navigation: ReactNode;
	portalLabel: string;
	roleIcon: ElementType;
	roleLabel: string;
	user: {
		username: string;
	};
	logoutAction: () => Promise<void>;
};

export const DashboardShell = ({
	children,
	headerAside,
	logoutAction,
	navigation,
	portalLabel,
	roleIcon: RoleIcon,
	roleLabel,
	user,
}: DashboardShellProps) => (
	<div className="flex min-h-screen flex-col bg-background text-white lg:h-screen lg:flex-row lg:overflow-hidden">
		<aside className="z-50 flex w-full flex-col border-white/5 border-b bg-background lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:w-[240px] lg:border-r lg:border-b-0">
			<div className="flex justify-center p-4 pb-4 lg:p-8 lg:pb-10">
				<Link
					href="/"
					aria-label="Voltar para a página inicial"
					className="inline-flex justify-center"
				>
					<GlitchLogo className="h-16 lg:h-28" />
				</Link>
			</div>

			{navigation}

			<div className="mt-auto p-4">
				<div className="rounded-sm border border-white/5 bg-white/5 p-4">
					<div className="mb-4 flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-sm border border-hextech-cyan/20 bg-hextech-cyan/20">
							<RoleIcon className="h-4 w-4 text-hextech-cyan" />
						</div>
						<div className="overflow-hidden">
							<p className="truncate text-[10px] font-black uppercase tracking-widest text-white">
								{user.username}
							</p>
							<p className="truncate text-[8px] font-medium uppercase tracking-widest text-white/40">
								{roleLabel}
							</p>
						</div>
					</div>
					<form action={logoutAction}>
						<DashboardSubmitButton
							variant="ghost"
							size="sm"
							pendingLabel="Saindo"
							className="h-auto w-full justify-start px-0 text-white/40 hover:bg-transparent hover:text-red-400"
						>
							<LogOut className="h-3 w-3" />
							Sair
						</DashboardSubmitButton>
					</form>
				</div>
			</div>
		</aside>

		<main className="relative flex min-w-0 flex-1 flex-col lg:ml-[240px]">
			<header className="sticky top-0 z-40 flex min-h-20 flex-wrap items-center justify-between gap-4 border-white/5 border-b bg-background/80 px-4 py-4 sm:px-6 lg:px-8">
				<h1 className="min-w-0 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
					EloNew / <span className="text-white">{portalLabel}</span>
				</h1>
				{headerAside}
			</header>

			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
				{children}
			</div>
		</main>
	</div>
);
