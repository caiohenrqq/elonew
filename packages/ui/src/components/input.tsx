import * as React from 'react';
import { cn } from '../utils/cn';

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'flex h-10 w-full rounded-sm border border-white/10 bg-white/5 px-3 py-2 text-xs text-white ring-offset-black file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan focus-visible:border-hextech-cyan disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = 'Input';

export { Input };
