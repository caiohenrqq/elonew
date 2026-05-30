import { Clock } from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';

export const OrderSupportCard = () => {
	return (
		<Card>
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
				<Button variant="secondary" className="w-full">
					Abrir Ticket
				</Button>
			</CardContent>
		</Card>
	);
};
