import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { OrderStatusBadge } from '@/shared/ui/components/status-badge';
import type { ClientOrder } from '../../model/orders';
import { getOrderStageCopy } from './order-stage-copy';
import { ResumePaymentButton } from './resume-payment-button';

type OrderDetailsHeaderProps = {
	order: ClientOrder;
};

export const OrderDetailsHeader = ({ order }: OrderDetailsHeaderProps) => {
	const canResumePayment = order.status === 'awaiting_payment';
	const copy = getOrderStageCopy(order.status);

	return (
		<>
			<Link
				href="/client"
				className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
			>
				<ArrowLeft className="w-3 h-3" />
				Voltar ao Painel
			</Link>

			<header className="flex flex-col justify-between gap-6 rounded-sm border border-white/5 bg-white/[0.02] p-6 sm:p-8 md:flex-row md:items-center">
				<div className="min-w-0 space-y-2">
					<div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
						<h1 className="break-all text-2xl font-black uppercase tracking-tight">
							{order.id}
						</h1>
						<OrderStatusBadge status={order.status} />
					</div>
					<p className="text-xs text-white/40 tracking-wider">
						{copy.headerDescription}
					</p>
				</div>
				{canResumePayment ? <ResumePaymentButton orderId={order.id} /> : null}
			</header>
		</>
	);
};
