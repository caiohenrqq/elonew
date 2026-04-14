import * as React from 'react';
import { cn } from '../utils/cn';

export interface CheckboxProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, type: _type, ...props }, ref) => (
		<input
			ref={ref}
			type="checkbox"
			className={cn(
				'h-3 w-3 rounded-sm border border-white/20 bg-white/5 text-hextech-cyan accent-hextech-cyan transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	),
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
