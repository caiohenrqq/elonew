import { cn } from '@packages/ui/utils/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type SelectableOptionLayout = 'card' | 'row';

type SelectableOptionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	children: ReactNode;
	layout?: SelectableOptionLayout;
	selected: boolean;
};

const layoutStyles: Record<SelectableOptionLayout, string> = {
	card: 'p-6 text-left group',
	row: 'flex items-center justify-between p-4',
};

const selectedStyles: Record<SelectableOptionLayout, string> = {
	card: 'bg-hextech-cyan/10 border-hextech-cyan text-white',
	row: 'bg-white/5 border-hextech-cyan text-white',
};

const idleStyles: Record<SelectableOptionLayout, string> = {
	card: 'bg-white/5 border-white/10 text-white hover:border-white/20',
	row: 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5',
};

export const SelectableOption = ({
	children,
	className,
	layout = 'card',
	selected,
	type = 'button',
	...props
}: SelectableOptionProps) => (
	<button
		type={type}
		aria-pressed={selected}
		className={cn(
			'rounded-sm border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan',
			layoutStyles[layout],
			selected ? selectedStyles[layout] : idleStyles[layout],
			className,
		)}
		{...props}
	>
		{children}
	</button>
);
