'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { GlitchLogo } from '../brand/glitch-logo';
import { getButtonClassName } from '../components/button';
import { labelText, navTextButton } from '../styles/classes';
import { useWordSwapAnimation, WordSwapText } from '../text/word-swap';
import { cn } from '../utils/cn';
import { useSectionScroll } from './use-section-scroll';

type WordSwapLinkProps = {
	children: string;
	href: string;
};

function WordSwapLink({ children, href }: WordSwapLinkProps) {
	const { bottomRef, getTriggerProps, topRef } = useWordSwapAnimation();
	const isSectionLink = href.startsWith('#');
	const scrollToSection = useSectionScroll();
	const className = navTextButton;

	if (isSectionLink) {
		return (
			<button
				type="button"
				{...getTriggerProps()}
				onClick={() => scrollToSection(href.slice(1))}
				className={className}
			>
				<WordSwapText topRef={topRef} bottomRef={bottomRef}>
					{children}
				</WordSwapText>
			</button>
		);
	}

	return (
		<a href={href} {...getTriggerProps()} className={className}>
			<WordSwapText topRef={topRef} bottomRef={bottomRef}>
				{children}
			</WordSwapText>
		</a>
	);
}

export function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const scrolledRef = useRef(false);
	const scrollToSection = useSectionScroll();

	useEffect(() => {
		const handleScroll = () => {
			const nextScrolled = window.scrollY > 50;
			if (nextScrolled === scrolledRef.current) return;

			scrolledRef.current = nextScrolled;
			setScrolled(nextScrolled);
		};

		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<motion.nav
			initial={{ y: -20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
			className="fixed top-0 left-0 w-full z-[100] pointer-events-none"
		>
			<div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
				<div
					className={cn(
						'flex justify-between items-center pointer-events-auto transition-all duration-700 rounded-sm border',
						scrolled
							? 'backdrop-blur-xl bg-black/60 border-white/10 py-4 px-6 md:px-8 shadow-[0_16px_36px_rgba(0,0,0,0.45)]'
							: 'bg-transparent border-transparent py-4 px-6 md:px-8',
					)}
				>
					<div className="flex items-center">
						<button
							type="button"
							aria-label="Voltar ao início"
							onClick={() => scrollToSection('hero')}
							className="focus-visible:outline-none"
						>
							<GlitchLogo />
						</button>
					</div>

					<div
						className={cn('hidden md:flex items-center gap-10', labelText.nav)}
					>
						<WordSwapLink href="#services">Serviços</WordSwapLink>
						<WordSwapLink href="#how-it-works">Processo</WordSwapLink>
						<WordSwapLink href="#about">Sobre</WordSwapLink>
					</div>

					<div className="flex items-center gap-6">
						<div className={cn('hidden sm:block', labelText.nav)}>
							<WordSwapLink href="/start">Portal do Cliente</WordSwapLink>
						</div>
						<Link
							href="/start"
							className={cn(
								getButtonClassName({
									size: 'sm',
									className:
										'px-6 py-2 text-[10px] tracking-[0.2em] duration-500 transform',
								}),
								scrolled
									? 'bg-hextech-cyan text-white hover:bg-white hover:text-black shadow-[0_0_20px_rgba(14,165,233,0.3)]'
									: 'bg-white text-black hover:bg-hextech-cyan hover:text-white',
							)}
						>
							Abrir App
						</Link>
					</div>
				</div>
			</div>
		</motion.nav>
	);
}
