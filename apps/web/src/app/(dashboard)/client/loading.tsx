const ClientDashboardLoading = () => {
	return (
		<div className="min-h-[50vh] space-y-6" aria-live="polite">
			<div className="h-4 w-40 rounded-sm bg-white/10" />
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<div className="h-32 rounded-sm border border-white/5 bg-white/[0.03]" />
				<div className="h-32 rounded-sm border border-white/5 bg-white/[0.03]" />
				<div className="h-32 rounded-sm border border-white/5 bg-white/[0.03]" />
			</div>
			<div className="h-64 rounded-sm border border-white/5 bg-white/[0.03]" />
		</div>
	);
};

export default ClientDashboardLoading;
