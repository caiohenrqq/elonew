'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import type { FocusEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { useRef } from 'react';

type MagneticButtonProps = {
	children: ReactNode;
	className?: string;
	onBlur?: (event: FocusEvent<HTMLButtonElement>) => void;
	onFocus?: (event: FocusEvent<HTMLButtonElement>) => void;
	onMouseEnter?: (event: MouseEvent<HTMLButtonElement>) => void;
	onMouseLeave?: (event: MouseEvent<HTMLButtonElement>) => void;
	onPointerEnter?: (event: PointerEvent<HTMLButtonElement>) => void;
	onPointerLeave?: (event: PointerEvent<HTMLButtonElement>) => void;
	onHoverChange?: (isHovering: boolean) => void;
};

export function MagneticButton({
	children,
	className,
	onBlur,
	onFocus,
	onMouseEnter,
	onMouseLeave,
	onPointerEnter,
	onPointerLeave,
	onHoverChange,
}: MagneticButtonProps) {
	const ref = useRef<HTMLButtonElement>(null);
	const hoveringRef = useRef(false);
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);
	const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
	const x = useSpring(mouseX, springConfig);
	const y = useSpring(mouseY, springConfig);

	const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
		if (!hoveringRef.current) {
			hoveringRef.current = true;
			onHoverChange?.(true);
		}

		const rect = ref.current?.getBoundingClientRect();
		if (!rect) return;

		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		mouseX.set((event.clientX - centerX) * 0.4);
		mouseY.set((event.clientY - centerY) * 0.4);
	};

	const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
		hoveringRef.current = false;
		mouseX.set(0);
		mouseY.set(0);
		onHoverChange?.(false);
		onMouseLeave?.(event);
	};

	return (
		<motion.button
			ref={ref}
			type="button"
			onBlur={onBlur}
			onFocus={onFocus}
			onMouseEnter={onMouseEnter}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			onPointerEnter={onPointerEnter}
			onPointerLeave={onPointerLeave}
			style={{ x, y }}
			className={className}
		>
			{children}
		</motion.button>
	);
}
