'use client';

import { useRef } from 'react';
import { LANDING_SERVICES } from '../../model/services';
import { SectionHeading } from '../../ui/section-heading';
import { ServiceCard } from '../../ui/service-card';
import { useHorizontalPinnedScroll } from '../../ui/use-horizontal-pinned-scroll';

export function ServicesSection() {
	const sectionRef = useRef<HTMLDivElement>(null);
	const horizontalRef = useRef<HTMLDivElement>(null);

	useHorizontalPinnedScroll(sectionRef, horizontalRef);

	return (
		<section
			id="services"
			ref={sectionRef}
			className="relative bg-background z-20 h-screen overflow-hidden flex flex-col justify-center"
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
