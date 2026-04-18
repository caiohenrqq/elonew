'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { useSectionScroll } from '@packages/ui/navigation/use-section-scroll';
import {
	useWordSwapAnimation,
	WordSwapText,
} from '@packages/ui/text/word-swap';
import Link from 'next/link';
import { useRef } from 'react';
import { CTA_STATS } from '../../model/cta-stats';
import { MagneticButton } from '../../ui/magnetic-button';

export function CtaSection() {
	const containerRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	const startSwap = useWordSwapAnimation();
	const catalogSwap = useWordSwapAnimation();
	const scrollToSection = useSectionScroll();

	useGSAP(
		() => {
			if (!containerRef.current || !innerRef.current) return;

			gsap.fromTo(
				innerRef.current,
				{
					width: '94%',
					scale: 0.96,
					borderRadius: '30px',
					backgroundColor: 'var(--color-surface-muted)',
				},
				{
					width: '100%',
					scale: 1,
					borderRadius: '0px',
					backgroundColor: 'var(--color-background)',
					ease: 'none',
					scrollTrigger: {
						trigger: containerRef.current,
						start: 'top top',
						end: '+=180%',
						scrub: true,
						pin: true,
						anticipatePin: 1,
					},
				},
			);

			gsap.from('.cta-reveal', {
				y: 60,
				opacity: 0,
				stagger: 0.1,
				duration: 1,
				ease: 'power3.out',
				scrollTrigger: {
					trigger: containerRef.current,
					start: 'top 10%',
					toggleActions: 'play none none reverse',
				},
			});

			gsap.to('.cta-orb', {
				y: -80,
				scale: 1.1,
				opacity: 0.2,
				scrollTrigger: {
					trigger: containerRef.current,
					start: 'top bottom',
					end: 'bottom top',
					scrub: true,
				},
			});

			gsap.from('.cta-stat', {
				y: 40,
				opacity: 0,
				duration: 1.2,
				ease: 'power3.out',
				stagger: 0.2,
				immediateRender: false,
				scrollTrigger: {
					trigger: containerRef.current,
					start: 'top 60%',
					toggleActions: 'play none none reverse',
				},
			});

			gsap.from('.cta-stat-value', {
				yPercent: 120,
				duration: 1.5,
				ease: 'power4.out',
				stagger: 0.2,
				immediateRender: false,
				scrollTrigger: {
					trigger: containerRef.current,
					start: 'top 60%',
					toggleActions: 'play none none reverse',
				},
			});

			gsap.from('.cta-stat-line', {
				scaleX: 0,
				transformOrigin: 'center',
				duration: 1.5,
				ease: 'power4.out',
				stagger: 0.2,
				immediateRender: false,
				scrollTrigger: {
					trigger: containerRef.current,
					start: 'top 60%',
					toggleActions: 'play none none reverse',
				},
			});

			const stats = gsap.utils.toArray<HTMLElement>('.cta-stat-value');
			for (const stat of stats) {
				const finalValueStr = stat.innerText;
				const numericPart = Number.parseFloat(
					finalValueStr.replace(/[^0-9.]/g, ''),
				);

				if (!Number.isNaN(numericPart)) {
					const suffix = finalValueStr.replace(/[0-9.]/g, '');
					const counter = { value: 0 };

					gsap.to(counter, {
						value: numericPart,
						duration: 4.5,
						ease: 'power2.out',
						scrollTrigger: {
							trigger: stat,
							start: 'top 90%',
							toggleActions: 'play none none reverse',
						},
						onUpdate: () => {
							stat.innerText = Math.floor(counter.value).toString() + suffix;
						},
					});
				}
			}
		},
		{ scope: containerRef },
	);

	return (
		<section
			id="about"
			ref={containerRef}
			className="relative w-full bg-background z-20"
		>
			<div
				ref={innerRef}
				className="relative h-screen w-full flex items-center justify-center overflow-hidden border border-white/5 shadow-2xl mx-auto"
			>
				<div className="cta-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-hextech-cyan/10 rounded-full blur-[100px] pointer-events-none" />

				<div className="max-w-4xl mx-auto text-center px-6 relative z-10 translate-y-8 md:translate-y-10">
					<div className="overflow-hidden mb-4">
						<span className="cta-reveal block text-[9px] font-black uppercase tracking-[0.6em] text-hextech-cyan">
							A ascensão final
						</span>
					</div>

					<h3 className="text-[10vw] md:text-[7.5rem] font-black uppercase tracking-tight text-white leading-[0.85] mb-12 select-none">
						<div className="overflow-hidden">
							<span className="cta-reveal block">DEIXE O</span>
						</div>
						<div className="overflow-hidden">
							<span
								className="cta-reveal block italic text-transparent"
								style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}
							>
								LOW ELO
							</span>
						</div>
						<div className="overflow-hidden">
							<span className="cta-reveal block">PARA TRÁS.</span>
						</div>
					</h3>

					<div className="cta-reveal flex flex-col md:flex-row gap-8 justify-center items-center">
						<Link href="/start">
							<MagneticButton
								onHoverChange={(isHovering) => startSwap.animate(isHovering)}
								onFocus={() => startSwap.animate(true)}
								onBlur={() => startSwap.animate(false)}
								className="px-14 py-6 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-sm hover:bg-hextech-cyan hover:text-white transition-colors shadow-[0_15px_60px_rgba(255,255,255,0.05)]"
							>
								<WordSwapText
									topRef={startSwap.topRef}
									bottomRef={startSwap.bottomRef}
								>
									Começar ascensão
								</WordSwapText>
							</MagneticButton>
						</Link>
						<button
							type="button"
							{...catalogSwap.getTriggerProps()}
							onClick={() => scrollToSection('services')}
							className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors py-4"
						>
							<WordSwapText
								topRef={catalogSwap.topRef}
								bottomRef={catalogSwap.bottomRef}
							>
								Explorar catálogo
							</WordSwapText>
						</button>
					</div>

					<div className="cta-reveal mt-24 flex flex-col md:flex-row justify-center items-center gap-16 md:gap-32 border-t border-white/5 pt-16 relative">
						<div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
						{CTA_STATS.map((stat) => (
							<div key={stat.label} className="cta-stat min-w-32 text-center">
								<p className="overflow-hidden text-6xl md:text-8xl font-black text-white leading-none mb-6 tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
									<span className="cta-stat-value block will-change-transform">
										{stat.value}
									</span>
								</p>
								<div className="cta-stat-line mx-auto mb-6 h-[2px] w-12 bg-hextech-cyan shadow-[0_0_10px_rgba(14,165,233,0.5)] will-change-transform" />
								<p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
									{stat.label}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
