import { resolve } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	turbopack: {
		root: resolve(__dirname, '../../'),
	},
};

export default nextConfig;
