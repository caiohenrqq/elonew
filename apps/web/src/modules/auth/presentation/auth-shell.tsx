'use client';

import { GradientNoise } from '@packages/ui/backgrounds/gradient-noise';
import { GlitchLogo } from '@packages/ui/brand/glitch-logo';
import { motion } from 'motion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type AuthShellProps = {
	children: ReactNode;
};

export const AuthShell = ({ children }: AuthShellProps) => {
	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
			<div className="absolute inset-0 z-0">
				<GradientNoise />
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
				className="relative z-10 w-full max-w-[400px] space-y-8"
			>
				<div className="flex flex-col items-center gap-6">
					<Link href="/" aria-label="Voltar para a página inicial">
						<GlitchLogo />
					</Link>
				</div>

				<div className="group/shell relative bg-[#0d0d0f]/80 border border-white/5 p-8 rounded-sm shadow-2xl overflow-hidden transition-colors hover:border-hextech-cyan/20">
					{children}
					<div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-hextech-cyan/50 to-transparent transform scale-x-0 group-hover/shell:scale-x-100 transition-transform duration-1000" />
				</div>

				<p className="text-center text-[10px] text-white/20 uppercase tracking-[0.2em]">
					&copy; 2026 EloNew &bull; Segurança de Ponta
				</p>
			</motion.div>
		</div>
	);
};
