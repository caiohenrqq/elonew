import * as React from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'outline' | 'success' | 'warning' | 'error';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
	({ className, variant = 'default', ...props }, ref) => {
		const baseStyles =
			'inline-flex items-center rounded-sm border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-hextech-cyan';

		const variants = {
			default: 'border-transparent bg-white/5 text-white/60',
			outline: 'border-white/10 text-white/40',
			success: 'border-transparent bg-emerald-500/10 text-emerald-400',
			warning: 'border-transparent bg-hextech-gold/10 text-hextech-gold',
			error: 'border-transparent bg-red-500/10 text-red-400',
		};

		return (
			<div
				ref={ref}
				className={cn(baseStyles, variants[variant], className)}
				{...props}
			/>
		);
	},
);

Badge.displayName = 'Badge';

export { Badge };
