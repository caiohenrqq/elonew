const BoosterDashboardLoading = () => {
	return (
		<div className="min-h-[50vh] space-y-8" aria-live="polite">
			<div className="grid gap-3 md:grid-cols-4">
				<div className="h-16 rounded-sm border border-white/5 bg-white/[0.03]" />
				<div className="h-16 rounded-sm border border-white/5 bg-white/[0.03]" />
				<div className="h-16 rounded-sm border border-white/5 bg-white/[0.03]" />
				<div className="h-16 rounded-sm border border-white/5 bg-white/[0.03]" />
			</div>
			<div className="grid gap-8 xl:grid-cols-[1fr_360px]">
				<div className="space-y-8">
					<div className="h-72 rounded-sm border border-white/5 bg-white/[0.03]" />
					<div className="h-56 rounded-sm border border-white/5 bg-white/[0.03]" />
				</div>
				<div className="space-y-6">
					<div className="h-80 rounded-sm border border-white/5 bg-white/[0.03]" />
					<div className="h-72 rounded-sm border border-white/5 bg-white/[0.03]" />
				</div>
			</div>
		</div>
	);
};

export default BoosterDashboardLoading;
