'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { useRef } from 'react';
import { LANDING_SERVICES } from '../../model/services';
import { SectionHeading } from '../../ui/section-heading';
import { ServiceCard } from '../../ui/service-card';

export function ServicesSection() {
	const sectionRef = useRef<HTMLDivElement>(null);
	const horizontalRef = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (!sectionRef.current || !horizontalRef.current) return;

			const scrollWidth = horizontalRef.current.scrollWidth;

			gsap.to(horizontalRef.current, {
				x: () => -(scrollWidth - window.innerWidth),
				ease: 'none',
				scrollTrigger: {
					trigger: sectionRef.current,
					pin: true,
					scrub: true,
					start: 'top top',
					end: () => `+=${scrollWidth}`,
					invalidateOnRefresh: true,
					anticipatePin: 1,
					pinSpacing: true,
				},
			});
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="relative bg-[#09090b] z-20 h-screen overflow-hidden flex flex-col justify-center"
		>
			<SectionHeading
				eyebrow="Catálogo profissional"
				title="Escolha seu"
				accent="serviço."
				className="px-10 max-w-6xl mx-auto w-full mb-6 md:mb-10"
			/>

			<div
				ref={horizontalRef}
				className="flex gap-10 pl-[10vw] md:pl-[30vw] pr-[10vw] items-center whitespace-nowrap"
			>
				{LANDING_SERVICES.map((service, index) => (
					<ServiceCard key={service.id} service={service} index={index} />
				))}
			</div>
		</section>
	);
}
