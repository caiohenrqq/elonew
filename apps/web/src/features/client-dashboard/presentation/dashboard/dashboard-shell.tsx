'use client';

import { GlitchLogo } from '@packages/ui/brand/glitch-logo';
import { cn } from '@packages/ui/utils/cn';
import { LayoutDashboard, LogOut, PlusCircle, User } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType, ReactNode } from 'react';
import { logoutAction } from '@/features/auth/actions/auth-actions';

type DashboardShellProps = {
	children: ReactNode;
	user: {
		username: string;
	};
};

type SidebarItemProps = {
	href: string;
	icon: ElementType;
	children: string;
	isActive: boolean;
};

const SIDEBAR_ITEMS = [
	{ href: '/client', icon: LayoutDashboard, label: 'Painel' },
	{ href: '/client/orders/new', icon: PlusCircle, label: 'Novo Pedido' },
] as const;

const SidebarItem = ({
	href,
	icon: Icon,
	children,
	isActive,
}: SidebarItemProps) => {
	return (
		<Link
			href={href}
			aria-current={isActive ? 'page' : undefined}
			className={cn(
				'group relative flex items-center gap-3 px-4 py-2.5 transition-all duration-300 rounded-sm overflow-hidden',
				isActive
					? 'text-white bg-white/[0.03]'
					: 'text-white/40 hover:text-white hover:bg-white/[0.05]',
			)}
		>
			{isActive ? (
				<motion.div
					layoutId="sidebar-active"
					className="absolute left-0 top-0 bottom-0 w-1 bg-hextech-cyan shadow-[0_0_10px_rgba(14,165,233,0.5)]"
					transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				/>
			) : (
				<div className="absolute left-0 top-0 bottom-0 w-0 bg-white/10 group-hover:w-full transition-all duration-500 -z-10" />
			)}
			<Icon
				className={cn(
					'w-4 h-4 transition-colors duration-300',
					isActive ? 'text-hextech-cyan' : 'group-hover:text-hextech-cyan/70',
				)}
			/>
			<span className="text-[10px] font-black uppercase tracking-[0.2em]">
				{children}
			</span>
		</Link>
	);
};

const isSidebarItemActive = (pathname: string, href: string) => {
	if (href === '/client') return pathname === href;
	return pathname === href || pathname.startsWith(`${href}/`);
};

export const DashboardShell = ({ children, user }: DashboardShellProps) => {
	const pathname = usePathname();

	return (
		<div className="flex min-h-screen bg-background text-white">
			<aside className="fixed left-0 top-0 bottom-0 w-[240px] border-r border-white/5 bg-background z-50 flex flex-col">
				<div className="p-8 pb-10">
					<Link href="/" aria-label="Voltar para a página inicial">
						<GlitchLogo />
					</Link>
				</div>

				<nav className="flex-1 px-4 space-y-1" aria-label="Portal do Cliente">
					{SIDEBAR_ITEMS.map((item) => (
						<SidebarItem
							key={item.href}
							href={item.href}
							icon={item.icon}
							isActive={isSidebarItemActive(pathname, item.href)}
						>
							{item.label}
						</SidebarItem>
					))}
				</nav>

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
								className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors w-full"
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
