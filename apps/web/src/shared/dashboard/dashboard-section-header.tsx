type DashboardSectionHeaderProps = {
	detail?: string;
	title: string;
};

export const DashboardSectionHeader = ({
	detail,
	title,
}: DashboardSectionHeaderProps) => (
	<div className="flex items-end justify-between gap-4">
		<h2 className="text-xs font-black uppercase tracking-[0.24em] text-white">
			{title}
		</h2>
		{detail ? (
			<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
				{detail}
			</p>
		) : null}
	</div>
);
