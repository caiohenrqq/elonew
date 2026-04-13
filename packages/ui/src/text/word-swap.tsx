'use client';

import type { RefObject } from 'react';
import { useRef } from 'react';
import { gsap } from '../animation/gsap';

type WordSwapTextProps = {
	children: string;
	bottomRef: RefObject<HTMLSpanElement | null>;
	topRef: RefObject<HTMLSpanElement | null>;
};

export function useWordSwapAnimation() {
	const topRef = useRef<HTMLSpanElement>(null);
	const bottomRef = useRef<HTMLSpanElement>(null);

	const animate = (isHovering: boolean) => {
		gsap.to(topRef.current, {
			yPercent: isHovering ? -115 : 0,
			duration: 0.72,
			ease: 'power4.out',
			overwrite: 'auto',
		});

		gsap.to(bottomRef.current, {
			yPercent: isHovering ? -100 : 15,
			duration: 0.72,
			ease: 'power4.out',
			overwrite: 'auto',
		});
	};

	return { animate, bottomRef, topRef };
}

export function WordSwapText({
	children,
	bottomRef,
	topRef,
}: WordSwapTextProps) {
	return (
		<span className="relative inline-block h-[1.45em] overflow-hidden leading-[1.45] align-middle">
			<span ref={topRef} className="block will-change-transform">
				{children}
			</span>
			<span
				ref={bottomRef}
				aria-hidden="true"
				className="absolute left-0 top-full block will-change-transform"
			>
				{children}
			</span>
		</span>
	);
}
