'use client';

import { BarChart3, FileText, Ticket, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import { DashboardNavItem } from '@/shared/dashboard/dashboard-nav-item';

type NavigationItem = {
	href: string;
	icon: ElementType;
	label: string;
};

const navigationItems: NavigationItem[] = [
	{ href: '/admin', label: 'Visão geral', icon: BarChart3 },
	{ href: '/admin/users', label: 'Usuários', icon: Users },
	{ href: '/admin/orders', label: 'Pedidos', icon: FileText },
	{ href: '/admin/support', label: 'Suporte', icon: Ticket },
];

const isActivePath = (pathname: string, href: string) => {
	if (href === '/admin') return pathname === href;
	return pathname === href || pathname.startsWith(`${href}/`);
};

export const AdminNavigation = () => {
	const pathname = usePathname();

	return (
		<nav className="flex-1 space-y-1 px-4" aria-label="Governança admin">
			{navigationItems.map((item) => (
				<DashboardNavItem
					key={item.href}
					href={item.href}
					icon={item.icon}
					isActive={isActivePath(pathname, item.href)}
					layoutId="admin-sidebar-active"
				>
					{item.label}
				</DashboardNavItem>
			))}
		</nav>
	);
};
