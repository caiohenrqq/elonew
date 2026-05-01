declare module 'lenis/react' {
	import type { ComponentType, ReactNode } from 'react';

	type LenisOptions = Record<string, unknown>;
	type LenisScrollTarget = number | string | HTMLElement;
	type LenisScrollOptions = {
		duration?: number;
		easing?: (progress: number) => number;
		lock?: boolean;
		onComplete?: () => void;
	};
	type LenisInstance = {
		scrollTo: (target: LenisScrollTarget, options?: LenisScrollOptions) => void;
	};

	type ReactLenisProps = {
		children?: ReactNode;
		className?: string;
		options?: LenisOptions;
		root?: boolean;
	};

	export const ReactLenis: ComponentType<ReactLenisProps>;

	export function useLenis(
		callback?: (...args: unknown[]) => void,
	): LenisInstance | undefined;
}
