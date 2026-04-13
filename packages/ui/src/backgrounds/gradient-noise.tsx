'use client';

export function GradientNoise() {
	return (
		<div className="absolute inset-0 overflow-hidden bg-[#09090b] pointer-events-none">
			<div
				className="absolute inset-0 opacity-80"
				style={{
					background:
						'radial-gradient(circle at 18% 18%, rgba(14, 165, 233, 0.16) 0, rgba(14, 165, 233, 0.08) 18%, transparent 42%), radial-gradient(circle at 86% 78%, rgba(245, 158, 11, 0.08) 0, transparent 34%)',
				}}
			/>
			<div
				className="absolute inset-0 opacity-[0.035]"
				style={{
					backgroundImage:
						'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
					backgroundSize: '72px 72px',
				}}
			/>
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#09090b]/80" />
		</div>
	);
}
