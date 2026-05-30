import * as React from 'react';
import { focusRing } from '../styles/classes';
import { cn } from '../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'info';
	icon?: React.ComponentType<{ className?: string }>;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
	({ className, variant = 'default', icon: Icon, children, ...props }, ref) => {
		const baseStyles = cn(
			'inline-flex items-center gap-1 rounded-sm border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors',
			focusRing,
		);

		const variants = {
			default: 'border-transparent bg-white/5 text-white/60',
			outline: 'border-white/10 text-white/40',
			success: 'border-transparent bg-emerald-500/10 text-emerald-400',
			warning: 'border-transparent bg-hextech-gold/10 text-hextech-gold',
			error: 'border-transparent bg-red-500/10 text-red-400',
			info: 'border-transparent bg-hextech-cyan/10 text-hextech-cyan',
		};

		return (
			<div
				ref={ref}
				className={cn(baseStyles, variants[variant], className)}
				{...props}
			>
				{Icon ? <Icon className="h-3 w-3 shrink-0" /> : null}
				{children}
			</div>
		);
	},
);

Badge.displayName = 'Badge';

export { Badge };
