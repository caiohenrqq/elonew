import { SmoothScroll } from '@packages/ui/providers/smooth-scroll';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const satoshi = localFont({
	src: [
		{
			path: '../../public/fonts/satoshi/Satoshi-Regular.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../../public/fonts/satoshi/Satoshi-Medium.woff2',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../../public/fonts/satoshi/Satoshi-Bold.woff2',
			weight: '700',
			style: 'normal',
		},
		{
			path: '../../public/fonts/satoshi/Satoshi-Black.woff2',
			weight: '900',
			style: 'normal',
		},
	],
	variable: '--font-satoshi',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'EloNew | Elo Boost profissional',
	description: 'Suba de elo com serviços profissionais de League of Legends.',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR" className={`${satoshi.variable}`}>
			<body className="antialiased">
				<SmoothScroll>{children}</SmoothScroll>
			</body>
		</html>
	);
}
