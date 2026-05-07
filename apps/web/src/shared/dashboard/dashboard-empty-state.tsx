import type { ElementType } from 'react';

type DashboardEmptyStateProps = {
	description: string;
	icon: ElementType;
	title: string;
};

export const DashboardEmptyState = ({
	description,
	icon: Icon,
	title,
}: DashboardEmptyStateProps) => (
	<div className="flex min-h-40 flex-col items-center justify-center space-y-3 px-6 py-10 text-center">
		<div className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/5 bg-white/[0.03]">
			<Icon className="h-5 w-5 text-hextech-cyan" />
		</div>
		<p className="text-[10px] font-black uppercase tracking-widest text-white/65">
			{title}
		</p>
		<p className="max-w-sm text-[10px] leading-relaxed text-white/40">
			{description}
		</p>
	</div>
);
