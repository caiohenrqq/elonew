'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const SmoothScroll = dynamic(
	() =>
		import('@packages/ui/providers/smooth-scroll').then(
			(module) => module.SmoothScroll,
		),
	{ ssr: false },
);

export const LandingScrollShell = ({ children }: { children: ReactNode }) => {
	const [isSmoothScrollEnabled, setIsSmoothScrollEnabled] = useState(false);

	useEffect(() => {
		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)',
		);

		if (!prefersReducedMotion.matches) setIsSmoothScrollEnabled(true);
	}, []);

	if (!isSmoothScrollEnabled) return children;

	return <SmoothScroll>{children}</SmoothScroll>;
};
