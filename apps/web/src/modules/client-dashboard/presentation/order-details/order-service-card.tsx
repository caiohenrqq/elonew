import { FileText } from 'lucide-react';
import { DefinitionItem } from '@/shared/dashboard/definition-item';
import { formatCurrency } from '@/shared/format/currency';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';
import { OrderStatusBadge } from '@/shared/ui/components/status-badge';
import type { ClientOrder } from '../../model/orders';
import { OrderRankRoute } from '../order-rank-route';
import { orderDetailsLayout } from './order-details-layout';

type OrderServiceCardProps = {
	order: ClientOrder;
};

export const OrderServiceCard = ({ order }: OrderServiceCardProps) => {
	return (
		<Card className={orderDetailsLayout.railCard}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileText className="w-4 h-4 text-hextech-cyan" />
					Dados do Serviço
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-7">
				<div className="space-y-2">
					<p className="text-[10px] text-white/40 uppercase tracking-widest">
						Rota
					</p>
					<OrderRankRoute
						size="md"
						currentLeague={order.currentLeague}
						currentDivision={order.currentDivision}
						desiredLeague={order.desiredLeague}
						desiredDivision={order.desiredDivision}
					/>
				</div>
				<div className="space-y-2">
					<p className="text-[10px] text-white/40 uppercase tracking-widest">
						Status
					</p>
					<OrderStatusBadge
						className="min-w-0 w-fit max-w-full"
						status={order.status}
					/>
				</div>
				<div className="grid gap-5 sm:grid-cols-3">
					<DefinitionItem
						label="Subtotal"
						value={formatCurrency(order.subtotal)}
						valueClassName="text-hextech-cyan"
					/>
					<DefinitionItem
						label="Desconto"
						value={formatCurrency(order.discountAmount)}
					/>
					<DefinitionItem
						label="Total"
						value={formatCurrency(order.totalAmount)}
						valueClassName="text-hextech-cyan"
					/>
				</div>
			</CardContent>
		</Card>
	);
};
