import * as React from 'react';
import { fieldSurface } from '../styles/classes';
import { cn } from '../utils/cn';

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					fieldSurface,
					'file:border-0 file:bg-transparent file:text-xs file:font-medium',
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
