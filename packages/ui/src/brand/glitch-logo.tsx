import Image from 'next/image';
import { cn } from '../utils/cn';

type GlitchLogoProps = {
	className?: string;
};

export function GlitchLogo({ className }: GlitchLogoProps) {
	return (
		<Image
			src="/images/EloNew.png"
			alt="EloNew"
			width={1227}
			height={1152}
			className={cn(
				'block h-28 w-auto cursor-pointer object-contain transition duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:brightness-110',
				className,
			)}
		/>
	);
}
