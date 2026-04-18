import * as React from 'react';
import { focusRing } from '../styles/classes';
import { cn } from '../utils/cn';

export interface CheckboxProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, type: _type, ...props }, ref) => (
		<input
			ref={ref}
			type="checkbox"
			className={cn(
				'h-3 w-3 cursor-pointer rounded-sm border border-white/20 bg-white/5 text-hextech-cyan accent-hextech-cyan transition-colors disabled:cursor-not-allowed disabled:opacity-50',
				focusRing,
				className,
			)}
			{...props}
		/>
	),
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
