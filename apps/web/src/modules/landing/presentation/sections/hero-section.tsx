'use client';

import { gsap, useGSAP } from '@packages/ui/animation/gsap';
import { GradientNoise } from '@packages/ui/backgrounds/gradient-noise';
import { Navbar } from '@packages/ui/navigation/navbar';
import { useSectionScroll } from '@packages/ui/navigation/use-section-scroll';
import {
	useWordSwapAnimation,
	WordSwapText,
} from '@packages/ui/text/word-swap';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';

export function HeroSection() {
	const containerRef = useRef<HTMLDivElement>(null);
	const climbSwap = useWordSwapAnimation();
	const servicesSwap = useWordSwapAnimation();
	const scrollToSection = useSectionScroll();

	useGSAP(
		() => {
			gsap.from('.hero-headline span', {
				y: 40,
				opacity: 0,
				stagger: 0.1,
				duration: 1,
				ease: 'power3.out',
				delay: 0.2,
			});

			gsap.from('.hero-content > p, .hero-content > div', {
				y: 20,
				opacity: 0,
				stagger: 0.1,
				duration: 0.8,
				ease: 'power2.out',
				delay: 0.6,
			});
		},
		{ scope: containerRef },
	);

	return (
		<section
			id="hero"
			ref={containerRef}
			className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
		>
			<Navbar />

			<div className="hero-bg absolute inset-0 z-0">
				<GradientNoise />
			</div>

			<div className="hero-content relative z-10 text-center max-w-5xl px-4 w-full">
				<h1 className="hero-headline text-5xl md:text-8xl font-black uppercase tracking-tight leading-tight mb-8 text-white">
					<span className="block opacity-90">Suba de</span>
					<span className="block text-hextech-cyan drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]">
						Elo.
					</span>
				</h1>
				<p className="text-base md:text-xl text-white/70 mb-12 max-w-2xl mx-auto font-medium">
					Boosting de League of Legends de alta performance feito por
					profissionais Challenger. Rápido, seguro e preciso.
				</p>
				<div className="flex flex-col md:flex-row gap-4 justify-center">
					<Link href="/start">
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							{...climbSwap.getTriggerProps()}
							className="w-full md:w-auto px-10 py-4 bg-hextech-cyan text-background font-bold uppercase tracking-widest rounded-sm hover:shadow-[0_0_20px_rgba(14,165,233,0.5)] transition-all"
						>
							<WordSwapText
								topRef={climbSwap.topRef}
								bottomRef={climbSwap.bottomRef}
							>
								Começar subida
							</WordSwapText>
						</motion.button>
					</Link>
					<motion.button
						type="button"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						{...servicesSwap.getTriggerProps()}
						onClick={() => scrollToSection('services')}
						className="w-full md:w-auto px-10 py-4 border border-foreground/20 hover:border-hextech-cyan/50 font-bold uppercase tracking-widest rounded-sm transition-all"
					>
						<WordSwapText
							topRef={servicesSwap.topRef}
							bottomRef={servicesSwap.bottomRef}
						>
							Ver serviços
						</WordSwapText>
					</motion.button>
				</div>
			</div>

			<div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
				<div className="w-px h-12 bg-gradient-to-b from-hextech-cyan to-transparent" />
			</div>
		</section>
	);
}
