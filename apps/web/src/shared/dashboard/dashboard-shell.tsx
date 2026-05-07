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
	<div className="flex min-h-screen bg-background text-white">
		<aside className="fixed left-0 top-0 bottom-0 z-50 flex w-[240px] flex-col border-r border-white/5 bg-background">
			<div className="flex justify-center p-8 pb-10">
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

		<main className="relative ml-[240px] flex-1">
			<header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-background/80 px-10">
				<h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
					EloNew / <span className="text-white">{portalLabel}</span>
				</h1>
				{headerAside}
			</header>

			<div className="p-10">{children}</div>
		</main>
	</div>
);
