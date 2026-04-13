declare module 'lenis/react' {
	import type { ComponentType, ReactNode } from 'react';

	type LenisOptions = Record<string, unknown>;

	type ReactLenisProps = {
		children?: ReactNode;
		className?: string;
		options?: LenisOptions;
		root?: boolean;
	};

	export const ReactLenis: ComponentType<ReactLenisProps>;

	export function useLenis(callback?: (...args: unknown[]) => void): unknown;
}
