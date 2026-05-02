'use client';

import { cn } from '@packages/ui/utils/cn';
import { BriefcaseBusiness, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ElementType } from 'react';
import {
	type BoosterDashboardTab,
	boosterDashboardTabs,
	parseBoosterDashboardTab,
} from '../../model/booster-tabs';

type SidebarItemProps = {
	href: string;
	icon: ElementType;
	children: string;
	isActive: boolean;
};

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
				'group relative flex items-center gap-3 overflow-hidden rounded-sm px-4 py-2.5 transition-all duration-300',
				isActive
					? 'bg-white/[0.03] text-white'
					: 'text-white/40 hover:bg-white/[0.05] hover:text-white',
			)}
		>
			{isActive ? (
				<motion.div
					layoutId="booster-sidebar-active"
					className="absolute left-0 top-0 bottom-0 w-1 bg-hextech-gold shadow-[0_0_10px_rgba(245,158,11,0.35)]"
					transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				/>
			) : null}
			<Icon
				className={cn(
					'h-4 w-4 transition-colors duration-300',
					isActive ? 'text-hextech-gold' : 'group-hover:text-hextech-gold/70',
				)}
			/>
			<span className="text-[10px] font-black uppercase tracking-[0.2em]">
				{children}
			</span>
		</Link>
	);
};

export const BoosterNavigation = () => {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const tab = parseBoosterDashboardTab(searchParams.get('tab') ?? undefined);

	return (
		<nav className="flex-1 space-y-1 px-4" aria-label="Portal do Booster">
			{boosterDashboardTabs.map((item) => (
				<SidebarItem
					key={item.href}
					href={item.href}
					icon={tabIcons[item.value]}
					isActive={isSidebarItemActive(pathname, tab, item.value)}
				>
					{item.label}
				</SidebarItem>
			))}
		</nav>
	);
};
