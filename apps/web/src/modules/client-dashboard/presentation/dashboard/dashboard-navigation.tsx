'use client';

import { cn } from '@packages/ui/utils/cn';
import { LayoutDashboard, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';

type SidebarItemProps = {
	href: string;
	icon: ElementType;
	children: string;
	isActive: boolean;
};

const sidebarItems = [
	{ href: '/client', icon: LayoutDashboard, label: 'Painel' },
	{ href: '/client/orders/new', icon: PlusCircle, label: 'Novo Pedido' },
] as const;

export const isSidebarItemActive = (pathname: string, href: string) => {
	if (href === '/client') return pathname === href;
	return pathname === href || pathname.startsWith(`${href}/`);
};

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

export const DashboardNavigation = () => {
	const pathname = usePathname();

	return (
		<nav className="flex-1 px-4 space-y-1" aria-label="Portal do Cliente">
			{sidebarItems.map((item) => (
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
	);
};
