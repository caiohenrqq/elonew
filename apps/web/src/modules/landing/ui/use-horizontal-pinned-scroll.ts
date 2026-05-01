'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import type { RefObject } from 'react';

export const useHorizontalPinnedScroll = (
	sectionRef: RefObject<HTMLDivElement | null>,
	horizontalRef: RefObject<HTMLDivElement | null>,
) => {
	useGSAP(
		() => {
			if (!sectionRef.current || !horizontalRef.current) return;

			const getScrollWidth = () => horizontalRef.current?.scrollWidth ?? 0;
			const getScrollDistance = () =>
				Math.max(0, getScrollWidth() - window.innerWidth);

			gsap.to(horizontalRef.current, {
				x: () => -getScrollDistance(),
				ease: 'none',
				scrollTrigger: {
					trigger: sectionRef.current,
					pin: true,
					scrub: true,
					start: 'top top',
					end: () => `+=${getScrollWidth()}`,
					invalidateOnRefresh: true,
					anticipatePin: 1,
					pinSpacing: true,
				},
			});
		},
		{ scope: sectionRef },
	);
};
