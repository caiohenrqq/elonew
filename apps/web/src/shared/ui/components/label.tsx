import * as React from 'react';
import { labelText } from '../styles/classes';
import { cn } from '../utils/cn';

export interface LabelProps
	extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
	({ className, ...props }, ref) => (
		// biome-ignore lint/a11y/noLabelWithoutControl: Reusable component that receives association via props
		<label
			ref={ref}
			className={cn(
				labelText.control,
				'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
				className,
			)}
			{...props}
		/>
	),
);
Label.displayName = 'Label';

export { Label };
