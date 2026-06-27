import type { AdminCouponSummaryOutput } from '../../server/coupon-contracts';
import { AdminCreateCouponForm } from './admin-create-coupon-form';
import { AdminDisableCouponButton } from './admin-disable-coupon-button';

const formatDiscount = (coupon: AdminCouponSummaryOutput): string =>
	coupon.discountType === 'percentage'
		? `${coupon.discount}%`
		: `R$${coupon.discount.toFixed(2)}`;

const formatLimit = (value: number | null): string =>
	value === null ? '∞' : String(value);

export const AdminCouponsPage = ({
	coupons,
}: {
	coupons: AdminCouponSummaryOutput[];
}) => {
	return (
		<div className="grid gap-6">
			<header className="grid gap-1">
				<h1 className="text-sm font-black uppercase tracking-[0.22em] text-white">
					Cupons
				</h1>
				<p className="text-xs text-white/45">
					Crie, liste e desative cupons de desconto.
				</p>
			</header>

			<AdminCreateCouponForm />

			<div className="overflow-x-auto rounded-sm border border-white/10">
				<table className="w-full min-w-[720px] text-left text-xs">
					<thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-white/35">
						<tr>
							<th className="px-3 py-2">Código</th>
							<th className="px-3 py-2">Desconto</th>
							<th className="px-3 py-2">Status</th>
							<th className="px-3 py-2">Uso</th>
							<th className="px-3 py-2">Limite global</th>
							<th className="px-3 py-2">Limite/usuário</th>
							<th className="px-3 py-2">1ª compra</th>
							<th className="px-3 py-2 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{coupons.length === 0 ? (
							<tr>
								<td className="px-3 py-6 text-white/35" colSpan={8}>
									Nenhum cupom criado ainda.
								</td>
							</tr>
						) : (
							coupons.map((coupon) => (
								<tr
									key={coupon.id}
									className="border-t border-white/5 text-white/70"
								>
									<td className="px-3 py-2 font-bold text-white">
										{coupon.code}
									</td>
									<td className="px-3 py-2">{formatDiscount(coupon)}</td>
									<td className="px-3 py-2">
										{coupon.isActive ? 'Ativo' : 'Desativado'}
									</td>
									<td className="px-3 py-2">{coupon.usageCount}</td>
									<td className="px-3 py-2">
										{formatLimit(coupon.globalUsageLimit)}
									</td>
									<td className="px-3 py-2">
										{formatLimit(coupon.perUserUsageLimit)}
									</td>
									<td className="px-3 py-2">
										{coupon.firstOrderOnly ? 'Sim' : 'Não'}
									</td>
									<td className="px-3 py-2 text-right">
										{coupon.isActive ? (
											<AdminDisableCouponButton couponId={coupon.id} />
										) : (
											<span className="text-white/25">—</span>
										)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};
