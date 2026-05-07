const Loading = () => (
	<div className="space-y-4 p-10">
		<div className="h-8 w-56 animate-pulse rounded-sm bg-white/10" />
		<div className="grid grid-cols-4 gap-4">
			{['revenue', 'orders', 'active-orders', 'active-users'].map((item) => (
				<div
					key={item}
					className="h-28 animate-pulse rounded-sm border border-white/10 bg-white/[0.03]"
				/>
			))}
		</div>
	</div>
);

export default Loading;
