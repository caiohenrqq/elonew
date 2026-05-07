'use client';

import { cn } from '@packages/ui/utils/cn';
import { motion } from 'motion/react';
import Link from 'next/link';
import type { ElementType, ReactNode } from 'react';

type DashboardNavItemProps = {
	children: ReactNode;
	href: string;
	icon: ElementType;
	isActive: boolean;
	layoutId: string;
};

export const DashboardNavItem = ({
	children,
	href,
	icon: Icon,
	isActive,
	layoutId,
}: DashboardNavItemProps) => (
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
				layoutId={layoutId}
				className="absolute left-0 top-0 bottom-0 w-1 bg-hextech-cyan shadow-[0_0_10px_rgba(14,165,233,0.5)]"
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
			/>
		) : (
			<div className="-z-10 absolute left-0 top-0 bottom-0 w-0 bg-white/10 transition-all duration-500 group-hover:w-full" />
		)}
		<Icon
			className={cn(
				'h-4 w-4 transition-colors duration-300',
				isActive ? 'text-hextech-cyan' : 'group-hover:text-hextech-cyan/70',
			)}
		/>
		<span className="text-[10px] font-black uppercase tracking-[0.2em]">
			{children}
		</span>
	</Link>
);
