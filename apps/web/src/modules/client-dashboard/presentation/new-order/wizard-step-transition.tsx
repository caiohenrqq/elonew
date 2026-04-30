'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { type ReactNode, useRef } from 'react';

type WizardStepTransitionProps = {
	children: ReactNode;
	stepKey: string;
};

export const WizardStepTransition = ({
	children,
	stepKey,
}: WizardStepTransitionProps) => {
	const containerRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			gsap.fromTo(
				containerRef.current,
				{
					autoAlpha: 0,
					y: 20,
				},
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
