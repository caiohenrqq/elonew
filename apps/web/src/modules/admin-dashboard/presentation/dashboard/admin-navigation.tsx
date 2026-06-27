'use client';

import {
	BarChart3,
	FileText,
	Ticket,
	TicketPercent,
	Users,
} from 'lucide-react';
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
	{ href: '/admin/coupons', label: 'Cupons', icon: TicketPercent },
	{ href: '/admin/support', label: 'Suporte', icon: Ticket },
];

const isActivePath = (pathname: string, href: string) => {
	if (href === '/admin') return pathname === href;
	return pathname === href || pathname.startsWith(`${href}/`);
};

export const AdminNavigation = () => {
	const pathname = usePathname();

	return (
		<nav
			className="grid flex-1 grid-cols-2 gap-2 px-4 sm:grid-cols-4 lg:block lg:space-y-1"
			aria-label="Admin"
		>
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
