type SectionHeadingProps = {
	eyebrow: string;
	title: string;
	accent: string;
	className?: string;
};

export function SectionHeading({
	eyebrow,
	title,
	accent,
	className,
}: SectionHeadingProps) {
	return (
		<div className={className}>
			<h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-hextech-cyan/80 mb-2">
				{eyebrow}
			</h2>
			<h3 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
				{title}{' '}
				<span className="text-hextech-cyan/40 drop-shadow-[0_0_10px_rgba(14,165,233,0.15)]">
					{accent}
				</span>
			</h3>
		</div>
	);
}
