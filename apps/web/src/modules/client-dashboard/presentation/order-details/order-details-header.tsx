import { Badge } from '@packages/ui/components/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ClientOrder } from '../../model/orders';
import { ResumePaymentButton } from './resume-payment-button';

type OrderDetailsHeaderProps = {
	order: ClientOrder;
};

export const OrderDetailsHeader = ({ order }: OrderDetailsHeaderProps) => {
	const canResumePayment = order.status === 'awaiting_payment';

	return (
		<>
			<Link
				href="/client"
				className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
			>
				<ArrowLeft className="w-3 h-3" />
				Voltar ao Painel
			</Link>

			<header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-8 rounded-sm">
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-black uppercase tracking-tight">
							{order.id}
						</h1>
						<Badge variant={order.statusVariant}>{order.statusLabel}</Badge>
					</div>
					<p className="text-xs text-white/40 tracking-wider">
						Os dados disponíveis deste pedido vieram da sua conta.
					</p>
				</div>
				{canResumePayment ? <ResumePaymentButton orderId={order.id} /> : null}
			</header>
		</>
	);
};
