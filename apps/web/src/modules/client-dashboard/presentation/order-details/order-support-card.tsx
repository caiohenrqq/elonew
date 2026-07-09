import { Clock } from 'lucide-react';
import Link from 'next/link';
import { getButtonClassName } from '@/shared/ui/components/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';
import { orderDetailsLayout } from './order-details-layout';

type OrderSupportCardProps = {
	orderId: string;
};

export const OrderSupportCard = ({ orderId }: OrderSupportCardProps) => {
	return (
		<Card className={orderDetailsLayout.railCard}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="w-4 h-4 text-hextech-cyan" />
					Suporte 24/7
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest">
					Precisa de ajuda com este pedido? Nossa equipe de suporte está
					disponível a qualquer momento.
				</p>
				<Link
					href={`/client/tickets/new?orderId=${encodeURIComponent(orderId)}`}
					className={getButtonClassName({
						variant: 'secondary',
						className: 'w-full',
					})}
				>
					Abrir Ticket
				</Link>
			</CardContent>
		</Card>
	);
};
