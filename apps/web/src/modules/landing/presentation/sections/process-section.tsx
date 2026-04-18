'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { useRef } from 'react';
import { PROCESS_STEPS } from '../../model/process-steps';
import { ProcessStepCard } from '../../ui/process-step-card';
import { SectionHeading } from '../../ui/section-heading';
import { useHorizontalPinnedScroll } from '../../ui/use-horizontal-pinned-scroll';

export function ProcessSection() {
	const sectionRef = useRef<HTMLDivElement>(null);
	const horizontalRef = useRef<HTMLDivElement>(null);

	useHorizontalPinnedScroll(sectionRef, horizontalRef);

	useGSAP(
		() => {
			if (!sectionRef.current) return;

			gsap.from('.how-it-works-title', {
				opacity: 0,
				y: 20,
				duration: 1,
				ease: 'power4.out',
				scrollTrigger: {
					trigger: sectionRef.current,
					start: 'top 80%',
				},
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section
			id="how-it-works"
			ref={sectionRef}
			className="relative bg-background overflow-hidden z-10 h-screen flex flex-col justify-center"
		>
			<SectionHeading
				eyebrow="Processo"
				title="Execução"
				accent="segura."
				className="px-10 max-w-6xl mx-auto w-full mb-6 md:mb-10 how-it-works-title"
			/>

			<div
				ref={horizontalRef}
				className="flex gap-16 px-[10vw] md:pl-[30vw] w-max items-center"
			>
				{PROCESS_STEPS.map((step) => (
					<ProcessStepCard key={step.number} step={step} />
				))}
			</div>

			<div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20 hidden md:block">
				<p className="text-[8px] font-black uppercase tracking-[0.5em] text-white">
					Role para continuar
				</p>
			</div>
		</section>
	);
}
