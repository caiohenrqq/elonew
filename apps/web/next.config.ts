import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import { getPublicApiBaseUrl } from './src/shared/env/public-env';

getPublicApiBaseUrl();

const nextConfig: NextConfig = {
	experimental: {
		optimizePackageImports: ['lucide-react'],
	},
	transpilePackages: ['@packages/auth', '@packages/shared'],
	turbopack: {
		resolveAlias: {
			'lenis/react': './node_modules/lenis/dist/lenis-react.mjs',
		},
		root: resolve(__dirname, '../../'),
	},
};

export default nextConfig;
