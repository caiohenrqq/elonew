import { cn } from '@packages/ui/utils/cn';

type DefinitionItemProps = {
	label: string;
	value: string;
	valueClassName?: string;
};

export const DefinitionItem = ({
	label,
	value,
	valueClassName,
}: DefinitionItemProps) => (
	<div className="space-y-1">
		<p className="text-[10px] text-white/40 uppercase tracking-widest">
			{label}
		</p>
		<p className={cn('text-xs font-bold uppercase', valueClassName)}>{value}</p>
	</div>
);
