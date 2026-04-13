import { resolve } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	transpilePackages: ['@packages/ui'],
	turbopack: {
		resolveAlias: {
			'@packages/ui/animation/gsap': '../../packages/ui/src/animation/gsap.ts',
			'@packages/ui/backgrounds/gradient-noise':
				'../../packages/ui/src/backgrounds/gradient-noise.tsx',
			'@packages/ui/brand/glitch-logo':
				'../../packages/ui/src/brand/glitch-logo.tsx',
			'@packages/ui/navigation/navbar':
				'../../packages/ui/src/navigation/navbar.tsx',
			'@packages/ui/providers/smooth-scroll':
				'../../packages/ui/src/providers/smooth-scroll.tsx',
			'@packages/ui/text/word-swap': '../../packages/ui/src/text/word-swap.tsx',
			'@packages/ui/utils/cn': '../../packages/ui/src/utils/cn.ts',
			'lenis/react': './node_modules/lenis/dist/lenis-react.mjs',
		},
		root: resolve(__dirname, '../../'),
	},
};

export default nextConfig;
