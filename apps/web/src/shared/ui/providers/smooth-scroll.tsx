'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { useCallback } from 'react';
import { ScrollTrigger } from '../animation/gsap';

function ScrollTriggerSync() {
	const updateScrollTrigger = useCallback(() => {
		ScrollTrigger.update();
	}, []);

	useLenis(updateScrollTrigger);

	return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
	return (
		<ReactLenis
			root
			options={{
				anchors: true,
				autoRaf: true,
				lerp: 0.08,
				smoothWheel: true,
				syncTouch: false,
				wheelMultiplier: 0.85,
			}}
		>
			<ScrollTriggerSync />
			{children}
		</ReactLenis>
	);
}
