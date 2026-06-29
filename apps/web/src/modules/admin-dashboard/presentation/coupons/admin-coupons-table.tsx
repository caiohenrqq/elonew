'use client';

import { Check, Copy, TicketPercent } from 'lucide-react';
import { Fragment, useState } from 'react';
import { DashboardEmptyState } from '@/shared/dashboard/dashboard-empty-state';
import { DashboardTableSection } from '@/shared/dashboard/dashboard-table-section';
import { Badge } from '@/shared/ui/components/badge';
import { getButtonClassName } from '@/shared/ui/components/button';
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/components/table';
import { cn } from '@/shared/ui/utils/cn';
import type { AdminCouponSummaryOutput } from '../../server/coupon-contracts';
import {
	AdminCouponReportButton,
	CouponReportPanel,
} from './admin-coupon-report-button';
import {
	AdminDisableCouponButton,
	AdminEnableCouponButton,
} from './admin-disable-coupon-button';

const headClass =
	'h-11 text-xs font-medium normal-case tracking-normal text-white/50';

const formatDiscount = (coupon: AdminCouponSummaryOutput) =>
	coupon.discountType === 'percentage'
		? `${coupon.discount}%`
		: `R$ ${coupon.discount.toFixed(2).replace('.', ',')}`;

const formatLimit = (value: number | null) =>
	value === null ? '∞' : String(value);

const CouponStatus = ({ active }: { active: boolean }) => (
	<Badge variant={active ? 'success' : 'outline'}>
		{active ? 'Ativo' : 'Inativo'}
	</Badge>
);

const CouponCode = ({ code }: { code: string }) => {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// clipboard unavailable — ignore
		}
	};

	return (
		<button
			type="button"
			onClick={copy}
			aria-label={`Copiar código ${code}`}
			className="group inline-flex items-center gap-2 rounded-sm font-mono text-sm font-bold text-white transition-colors hover:text-hextech-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hextech-cyan"
		>
			{code}
			{copied ? (
				<Check className="h-3.5 w-3.5 text-emerald-400" />
			) : (
				<Copy className="h-3.5 w-3.5 text-white/25 transition-colors group-hover:text-hextech-cyan" />
			)}
		</button>
	);
};

const AdminCouponCard = ({ coupon }: { coupon: AdminCouponSummaryOutput }) => (
	<article className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
		<div className="flex items-start justify-between gap-3">
			<CouponCode code={coupon.code} />
			<CouponStatus active={coupon.isActive} />
		</div>
		<div className="mt-4 grid grid-cols-2 gap-3 border-white/5 border-t pt-3 text-xs text-white/70">
			<div>
				<p className="text-[10px] uppercase tracking-widest text-white/35">
					Desconto
				</p>
				<p className="mt-1 tabular-nums">{formatDiscount(coupon)}</p>
			</div>
			<div>
				<p className="text-[10px] uppercase tracking-widest text-white/35">
					Uso
				</p>
				<p className="mt-1 tabular-nums">{coupon.usageCount}</p>
			</div>
			<div>
				<p className="text-[10px] uppercase tracking-widest text-white/35">
					Limites (global / usuário)
				</p>
				<p className="mt-1 tabular-nums">
					{formatLimit(coupon.globalUsageLimit)} /{' '}
					{formatLimit(coupon.perUserUsageLimit)}
				</p>
			</div>
			<div>
				<p className="text-[10px] uppercase tracking-widest text-white/35">
					1ª compra
				</p>
				<p className="mt-1">{coupon.firstOrderOnly ? 'Sim' : 'Não'}</p>
			</div>
		</div>
		<div className="mt-4 flex flex-wrap items-center justify-end gap-2">
			<AdminCouponReportButton couponId={coupon.id} />
			{coupon.isActive ? (
				<AdminDisableCouponButton couponId={coupon.id} />
			) : (
				<AdminEnableCouponButton couponId={coupon.id} />
			)}
		</div>
	</article>
);

export const AdminCouponsTable = ({
	coupons,
}: {
	coupons: AdminCouponSummaryOutput[];
}) => {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	return (
		<DashboardTableSection
			isEmpty={coupons.length === 0}
			colSpan={8}
			mobileContent={coupons.map((coupon) => (
				<AdminCouponCard key={coupon.id} coupon={coupon} />
			))}
			emptyState={
				<DashboardEmptyState
					icon={TicketPercent}
					title="Nenhum cupom criado"
					description="Crie seu primeiro cupom para começar a gerenciá-los aqui."
				/>
			}
		>
			<TableHeader>
				<TableRow className="hover:bg-transparent">
					<TableHead className={headClass}>Código</TableHead>
					<TableHead className={cn(headClass, 'text-right')}>
						Desconto
					</TableHead>
					<TableHead className={headClass}>Status</TableHead>
					<TableHead className={cn(headClass, 'text-right')}>Uso</TableHead>
					<TableHead className={cn(headClass, 'text-right')}>
						Limite global
					</TableHead>
					<TableHead className={cn(headClass, 'text-right')}>
						Limite/usuário
					</TableHead>
					<TableHead className={headClass}>1ª compra</TableHead>
					<TableHead className={cn(headClass, 'text-right')}>Ações</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{coupons.map((coupon) => {
					const expanded = expandedId === coupon.id;
					return (
						<Fragment key={coupon.id}>
							<TableRow className={cn('h-14', expanded && 'bg-white/[0.02]')}>
								<TableCell>
									<CouponCode code={coupon.code} />
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatDiscount(coupon)}
								</TableCell>
								<TableCell>
									<CouponStatus active={coupon.isActive} />
								</TableCell>
								<TableCell className="text-right tabular-nums text-white/80">
									{coupon.usageCount}
								</TableCell>
								<TableCell className="text-right tabular-nums text-white/60">
									{formatLimit(coupon.globalUsageLimit)}
								</TableCell>
								<TableCell className="text-right tabular-nums text-white/60">
									{formatLimit(coupon.perUserUsageLimit)}
								</TableCell>
								<TableCell className="text-white/60">
									{coupon.firstOrderOnly ? 'Sim' : 'Não'}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-2">
										<button
											type="button"
											onClick={() => setExpandedId(expanded ? null : coupon.id)}
											className={getButtonClassName({
												variant: 'outline',
												size: 'sm',
											})}
										>
											{expanded ? 'Ocultar' : 'Relatório'}
										</button>
										{coupon.isActive ? (
											<AdminDisableCouponButton couponId={coupon.id} />
										) : (
											<AdminEnableCouponButton couponId={coupon.id} />
										)}
									</div>
								</TableCell>
							</TableRow>
							{expanded ? (
								<TableRow className="hover:bg-transparent">
									<TableCell colSpan={8} className="px-4 pt-0 pb-4">
										<CouponReportPanel couponId={coupon.id} />
									</TableCell>
								</TableRow>
							) : null}
						</Fragment>
					);
				})}
			</TableBody>
		</DashboardTableSection>
	);
};
