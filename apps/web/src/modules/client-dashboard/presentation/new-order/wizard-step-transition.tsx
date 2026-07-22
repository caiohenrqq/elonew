'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { gsap, useGSAP } from '@/shared/ui/animation/gsap';

type WizardStepTransitionProps = {
	children: ReactNode;
	stepKey: string;
};

export const WizardStepTransition = ({
	children,
	stepKey,
}: WizardStepTransitionProps) => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!stepKey) return;
		const heading = containerRef.current?.querySelector<HTMLElement>('h2');
		heading?.setAttribute('tabindex', '-1');
		heading?.focus();
	}, [stepKey]);

	useGSAP(
		() => {
			if (
				!stepKey ||
				window.matchMedia('(prefers-reduced-motion: reduce)').matches
			)
				return;

			gsap.fromTo(
				containerRef.current,
				{ autoAlpha: 0, y: 20 },
				{
					autoAlpha: 1,
					y: 0,
					duration: 0.45,
					ease: 'power3.out',
					clearProps: 'transform',
				},
			);
		},
		{ scope: containerRef, dependencies: [stepKey] },
	);

	return (
		<div key={stepKey} ref={containerRef}>
			{children}
		</div>
	);
};
