'use client';

import { FileText, LayoutDashboard, LifeBuoy, PlusCircle } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ElementType } from 'react';
import { DashboardNavItem } from '@/shared/dashboard/dashboard-nav-item';
import {
	type ClientDashboardTab,
	clientDashboardTabs,
	parseClientDashboardTab,
} from '../../model/client-tabs';

const tabIcons: Record<ClientDashboardTab, ElementType> = {
	overview: LayoutDashboard,
	orders: FileText,
	tickets: LifeBuoy,
};

const actionItems = [
	{ href: '/client/orders/new', icon: PlusCircle, label: 'Novo Pedido' },
	{ href: '/client/tickets/new', icon: LifeBuoy, label: 'Novo Ticket' },
] as const;

export const isSidebarItemActive = (
	pathname: string,
	href: string,
	tab?: string,
	itemTab?: string,
) => {
	if (href.startsWith('/client?')) {
		return pathname === '/client' && tab === itemTab;
	}

	return pathname === href || pathname.startsWith(`${href}/`);
};

export const DashboardNavigation = () => {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const tab = parseClientDashboardTab(searchParams.get('tab') ?? undefined);

	return (
		<nav
			className="grid flex-1 grid-cols-2 gap-2 px-4 sm:grid-cols-4 lg:block lg:space-y-1"
			aria-label="Portal do Cliente"
		>
			{clientDashboardTabs.map((item) => (
				<DashboardNavItem
					key={item.href}
					href={item.href}
					icon={tabIcons[item.value]}
					isActive={isSidebarItemActive(pathname, item.href, tab, item.value)}
					layoutId="client-sidebar-active"
				>
					{item.label}
				</DashboardNavItem>
			))}
			{actionItems.map((item) => (
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
