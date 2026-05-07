'use client';

import { BriefcaseBusiness, LayoutDashboard } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ElementType } from 'react';
import { DashboardNavItem } from '@/shared/dashboard/dashboard-nav-item';
import {
	type BoosterDashboardTab,
	boosterDashboardTabs,
	parseBoosterDashboardTab,
} from '../../model/booster-tabs';

const tabIcons: Record<BoosterDashboardTab, ElementType> = {
	queue: LayoutDashboard,
	work: BriefcaseBusiness,
};

const isSidebarItemActive = (
	pathname: string,
	tab: string,
	itemTab: string,
) => {
	if (pathname !== '/booster') return false;
	return tab === itemTab;
};

export const BoosterNavigation = () => {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const tab = parseBoosterDashboardTab(searchParams.get('tab') ?? undefined);

	return (
		<nav className="flex-1 space-y-1 px-4" aria-label="Portal do Booster">
			{boosterDashboardTabs.map((item) => (
				<DashboardNavItem
					key={item.href}
					href={item.href}
					icon={tabIcons[item.value]}
					isActive={isSidebarItemActive(pathname, tab, item.value)}
					layoutId="booster-sidebar-active"
				>
					{item.label}
				</DashboardNavItem>
			))}
		</nav>
	);
};
