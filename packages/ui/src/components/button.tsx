import * as React from 'react';
import { disabledState, focusRing } from '../styles/classes';
import { cn } from '../utils/cn';

export const buttonVariants = {
	variant: {
		primary: 'bg-hextech-cyan text-white hover:bg-white hover:text-black',
		secondary: 'bg-white text-black hover:bg-hextech-cyan hover:text-white',
		outline:
			'border border-white/10 bg-transparent text-white hover:bg-white/5 hover:border-white/20',
		ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/5',
		danger: 'bg-red-500 text-white hover:bg-red-600',
	},
	size: {
		sm: 'h-8 px-4 text-[10px]',
		md: 'h-10 px-6 text-[10px]',
		lg: 'h-12 px-8 text-[11px]',
		icon: 'h-10 w-10',
	},
};

export type ButtonVariant = keyof typeof buttonVariants.variant;
export type ButtonSize = keyof typeof buttonVariants.size;

export const buttonBaseClassName = cn(
	'inline-flex cursor-pointer items-center justify-center rounded-sm text-sm font-black uppercase tracking-[0.15em] transition-all duration-200 active:scale-95',
	focusRing,
	disabledState,
);

export const getButtonClassName = ({
	className,
	size = 'md',
	variant = 'primary',
}: {
	className?: string;
	size?: ButtonSize;
	variant?: ButtonVariant;
}) =>
	cn(
		buttonBaseClassName,
		buttonVariants.variant[variant],
		buttonVariants.size[size],
		className,
	);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className, type = 'button', variant = 'primary', size = 'md', ...props },
		ref,
	) => {
		return (
			<button
				ref={ref}
				type={type}
				className={getButtonClassName({ className, size, variant })}
				{...props}
			/>
		);
	},
);

Button.displayName = 'Button';

export { Button };
