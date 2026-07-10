'use client';

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/ui/utils/cn';

type ModalProps = {
	onClose: () => void;
	labelledBy?: string;
	label?: string;
	className?: string;
	children: ReactNode;
};

export const Modal = ({
	onClose,
	labelledBy,
	label,
	className,
	children,
}: ModalProps) => {
	if (typeof document === 'undefined') return null;

	return createPortal(
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
			<button
				type="button"
				aria-label="Fechar modal"
				className="absolute inset-0 cursor-default"
				onClick={onClose}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={labelledBy}
				aria-label={label}
				className={cn(
					'relative w-full max-w-md rounded-sm border border-white/10 bg-background p-5 shadow-2xl',
					className,
				)}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
};
