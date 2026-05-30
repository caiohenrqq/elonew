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

type OrderServiceCardProps = {
	order: ClientOrder;
};

export const OrderServiceCard = ({ order }: OrderServiceCardProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileText className="w-4 h-4 text-hextech-cyan" />
					Dados do Serviço
				</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-2 md:grid-cols-4 gap-8">
				<div className="space-y-1">
					<p className="text-[10px] text-white/40 uppercase tracking-widest">
						Status
					</p>
					<OrderStatusBadge status={order.status} />
				</div>
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
			</CardContent>
		</Card>
	);
};
