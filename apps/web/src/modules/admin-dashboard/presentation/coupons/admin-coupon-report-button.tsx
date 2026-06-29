'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DefinitionItem } from '@/shared/dashboard/definition-item';
import { formatCurrency } from '@/shared/format/currency';
import { getButtonClassName } from '@/shared/ui/components/button';
import { getCouponReportAction } from '../../actions/coupon-actions';
import type { AdminCouponReportOutput } from '../../server/coupon-contracts';

export const CouponReportPanel = ({ couponId }: { couponId: string }) => {
	const [report, setReport] = useState<AdminCouponReportOutput | null>(null);
	const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading');

	useEffect(() => {
		let active = true;
		setStatus('loading');
		getCouponReportAction(couponId).then((result) => {
			if (!active) return;
			if (result) {
				setReport(result);
				setStatus('done');
			} else {
				setStatus('error');
			}
		});
		return () => {
			active = false;
		};
	}, [couponId]);

	return (
		<div className="rounded-sm border border-white/10 bg-black/20 p-4">
			<p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/35">
				Desempenho do cupom
			</p>
			{status === 'loading' ? (
				<div className="flex items-center gap-2 text-[11px] text-white/40">
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
					Carregando relatório
				</div>
			) : status === 'error' || !report ? (
				<p className="text-[11px] text-red-300">Relatório indisponível.</p>
			) : (
				<div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
					<DefinitionItem label="Usos" value={String(report.usageCount)} />
					<DefinitionItem
						label="Aplicados"
						value={String(report.appliedCount)}
					/>
					<DefinitionItem
						label="Conversão"
						value={`${Math.round(report.conversionRate * 100)}%`}
					/>
					<DefinitionItem
						label="Clientes"
						value={String(report.uniqueClients)}
					/>
					<DefinitionItem
						label="Receita"
						value={formatCurrency(report.revenueCents)}
					/>
					<DefinitionItem
						label="Desconto"
						value={formatCurrency(report.discountTotalCents)}
					/>
				</div>
			)}
		</div>
	);
};

export const AdminCouponReportButton = ({ couponId }: { couponId: string }) => {
	const [open, setOpen] = useState(false);

	return (
		<div className="grid gap-3">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className={getButtonClassName({ variant: 'outline', size: 'sm' })}
			>
				{open ? 'Ocultar' : 'Relatório'}
			</button>
			{open ? <CouponReportPanel couponId={couponId} /> : null}
		</div>
	);
};
