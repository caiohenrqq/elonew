import { ArrowLeft, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { DashboardEntrance } from '@/shared/dashboard/dashboard-entrance';
import { getButtonClassName } from '@/shared/ui/components/button';
import { createSupportTicketAction } from '../../actions/order-actions';
import type { ClientDashboardOrder } from '../../model/orders';
import { SupportTicketPanel } from './support-ticket-panel';

type NewTicketPageProps = {
	initialOrderId?: string;
	orders: ClientDashboardOrder[];
};

export const NewTicketPage = ({
	initialOrderId,
	orders,
}: NewTicketPageProps) => (
	<DashboardEntrance>
		<div className="dashboard-animate flex flex-none flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div className="flex items-start gap-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-hextech-cyan/25 bg-hextech-cyan/10">
					<LifeBuoy className="h-5 w-5 text-hextech-cyan" />
				</div>
				<div className="space-y-1">
					<h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
						Novo ticket
					</h2>
					<p className="text-[10px] text-white/40 tracking-wider">
						Suporte para pedidos, pagamento, acesso ou dúvidas durante o
						serviço.
					</p>
				</div>
			</div>

			<Link
				href="/client?tab=tickets"
				className={getButtonClassName({
					variant: 'outline',
					size: 'sm',
					className: 'w-fit gap-2 font-black uppercase tracking-widest',
				})}
			>
				<ArrowLeft className="h-3 w-3" />
				Tickets
			</Link>
		</div>

		<SupportTicketPanel
			action={createSupportTicketAction}
			initialOrderId={initialOrderId}
			orders={orders}
		/>
	</DashboardEntrance>
);
