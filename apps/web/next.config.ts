import { resolve } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	experimental: {
		optimizePackageImports: ['lucide-react'],
	},
	transpilePackages: ['@packages/ui'],
	turbopack: {
		resolveAlias: {
			'lenis/react': './node_modules/lenis/dist/lenis-react.mjs',
		},
		root: resolve(__dirname, '../../'),
	},
};

export default nextConfig;
