import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { Badge } from '@/shared/ui/components/badge';
import type { AdminCouponSummaryOutput } from '../../server/coupon-contracts';
import { AdminCouponsTable } from './admin-coupons-table';
import { AdminCreateCouponDialog } from './admin-create-coupon-dialog';

const formatStat = (value: number) => value.toString().padStart(2, '0');

export const AdminCouponsPage = ({
	coupons,
}: {
	coupons: AdminCouponSummaryOutput[];
}) => {
	const active = coupons.filter((coupon) => coupon.isActive).length;
	const totalUses = coupons.reduce((sum, coupon) => sum + coupon.usageCount, 0);

	const stats = [
		{ label: 'Total', value: formatStat(coupons.length) },
		{ label: 'Ativos', value: formatStat(active) },
		{ label: 'Usos totais', value: formatStat(totalUses) },
		{ label: 'Inativos', value: formatStat(coupons.length - active) },
	];

	return (
		<DashboardEntrance>
			<div className="dashboard-animate flex min-h-0 flex-1 flex-col gap-6">
				<header className="flex flex-none flex-wrap items-start justify-between gap-4">
					<div className="space-y-1.5">
						<div className="flex items-center gap-2.5">
							<h2 className="text-sm font-black uppercase tracking-[0.25em] text-white">
								Cupons
							</h2>
							<Badge variant="outline">{coupons.length}</Badge>
						</div>
						<p className="text-xs text-white/40">
							Crie e gerencie os cupons de desconto da plataforma.
						</p>
					</div>
					<AdminCreateCouponDialog />
				</header>

				<div className="grid flex-none gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="rounded-sm border border-white/10 bg-white/[0.02] px-4 py-3"
						>
							<p className="text-[10px] font-black uppercase tracking-widest text-white/35">
								{stat.label}
							</p>
							<p className="mt-1.5 text-xl font-black tabular-nums text-white">
								{stat.value}
							</p>
						</div>
					))}
				</div>

				<AdminCouponsTable coupons={coupons} />
			</div>
		</DashboardEntrance>
	);
};
