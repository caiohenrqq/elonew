import { GlitchLogo } from '@packages/ui/brand/glitch-logo';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import type { ElementType, ReactNode } from 'react';

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
	<div className="flex min-h-screen flex-col bg-background text-white lg:flex-row">
		<aside className="z-50 flex w-full flex-col border-white/5 border-b bg-background lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:w-[240px] lg:border-r lg:border-b-0">
			<div className="flex justify-center p-6 pb-6 lg:p-8 lg:pb-10">
				<Link
					href="/"
					aria-label="Voltar para a página inicial"
					className="inline-flex justify-center"
				>
					<GlitchLogo />
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
						<button
							type="submit"
							className="flex w-full cursor-pointer items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 transition-colors hover:text-red-400"
						>
							<LogOut className="h-3 w-3" />
							Sair
						</button>
					</form>
				</div>
			</div>
		</aside>

		<main className="relative min-w-0 flex-1 lg:ml-[240px]">
			<header className="sticky top-0 z-40 flex min-h-20 flex-wrap items-center justify-between gap-4 border-white/5 border-b bg-background/80 px-4 py-4 sm:px-6 lg:px-10">
				<h1 className="min-w-0 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
					EloNew / <span className="text-white">{portalLabel}</span>
				</h1>
				{headerAside}
			</header>

			<div className="p-4 sm:p-6 lg:p-10">{children}</div>
		</main>
	</div>
);
