'use client';

import { LayoutDashboard, PlusCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { DashboardNavItem } from '@/shared/dashboard/dashboard-nav-item';

const sidebarItems = [
	{ href: '/client', icon: LayoutDashboard, label: 'Painel' },
	{ href: '/client/orders/new', icon: PlusCircle, label: 'Novo Pedido' },
] as const;

export const isSidebarItemActive = (pathname: string, href: string) => {
	if (href === '/client') return pathname === href;
	return pathname === href || pathname.startsWith(`${href}/`);
};

export const DashboardNavigation = () => {
	const pathname = usePathname();

	return (
		<nav className="flex-1 space-y-1 px-4" aria-label="Portal do Cliente">
			{sidebarItems.map((item) => (
				<DashboardNavItem
					key={item.href}
					href={item.href}
					icon={item.icon}
					isActive={isSidebarItemActive(pathname, item.href)}
					layoutId="client-sidebar-active"
				>
					{item.label}
				</DashboardNavItem>
			))}
		</nav>
	);
};
