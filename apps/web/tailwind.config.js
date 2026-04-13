module.exports = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/features/**/*.{js,ts,jsx,tsx,mdx}',
		'../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				background: '#09090b',
				foreground: '#fafafa',
				hextech: {
					cyan: '#0ea5e9',
					gold: '#f59e0b',
				},
				challenger: '#f59e0b',
				muted: '#18181b',
			},
			fontFamily: {
				satoshi: ['var(--font-satoshi)', 'sans-serif'],
			},
		},
	},
	plugins: [],
};
