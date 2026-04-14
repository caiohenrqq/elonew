import * as React from 'react';
import { cn } from '../utils/cn';

export interface SelectProps
	extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
	({ className, children, ...props }, ref) => {
		return (
			<div className="relative">
				<select
					className={cn(
						'flex h-10 w-full appearance-none rounded-sm border border-white/10 bg-white/5 px-3 py-2 text-xs text-white ring-offset-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan focus-visible:border-hextech-cyan disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
						className,
					)}
					ref={ref}
					{...props}
				>
					{children}
				</select>
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/40">
					<svg
						className="h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>
		);
	},
);
Select.displayName = 'Select';

export { Select };
