'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import type { ReactNode } from 'react';
import { useRef } from 'react';

type DashboardEntranceProps = {
	children: ReactNode;
};

export const DashboardEntrance = ({ children }: DashboardEntranceProps) => {
	const containerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			gsap.from('.dashboard-animate', {
				y: 20,
				opacity: 0,
				stagger: 0.1,
				duration: 0.8,
				ease: 'power3.out',
			});
		},
		{ scope: containerRef },
	);

	return (
		<div ref={containerRef} className="space-y-10">
			{children}
		</div>
	);
};
