import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import { FileText } from 'lucide-react';
import { type ClientOrder, formatCurrency } from '../../model/orders';
import { DefinitionItem } from './definition-item';

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
				<DefinitionItem label="Status" value={order.statusLabel} />
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
