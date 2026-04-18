import { Button } from '@packages/ui/components/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import { Clock } from 'lucide-react';

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
