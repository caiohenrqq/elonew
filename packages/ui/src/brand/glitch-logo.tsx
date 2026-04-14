export function GlitchLogo() {
	return (
		<div className="relative flex items-center gap-1 group cursor-pointer">
			<div className="relative text-2xl font-black tracking-widest uppercase text-white overflow-hidden">
				<span className="relative z-10">ELONEW</span>
				<span
					className="absolute inset-0 text-hextech-cyan opacity-0 group-hover:opacity-50 group-hover:-translate-x-0.5 transition-transform duration-150"
					aria-hidden="true"
				>
					ELONEW
				</span>
				<span
					className="absolute inset-0 text-[#f59e0b] opacity-0 group-hover:opacity-40 group-hover:translate-x-0.5 transition-transform duration-150"
					aria-hidden="true"
				>
					ELONEW
				</span>
			</div>

			<div className="w-1.5 h-1.5 bg-hextech-cyan rounded-full shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
		</div>
	);
}
