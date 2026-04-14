import * as React from 'react';
import { cn } from '../utils/cn';

export interface LabelProps
	extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
	({ className, ...props }, ref) => (
		// biome-ignore lint/a11y/noLabelWithoutControl: Reusable component that receives association via props
		<label
			ref={ref}
			className={cn(
				'text-[10px] font-black uppercase tracking-[0.2em] leading-none text-white/40 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
				className,
			)}
			{...props}
		/>
	),
);
Label.displayName = 'Label';

export { Label };
