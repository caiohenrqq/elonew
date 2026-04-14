import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import { Activity } from 'lucide-react';

export const OrderActivityCard = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="w-4 h-4 text-hextech-cyan" />
					Atividade Recente
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-xs text-white/40 leading-relaxed">
					O histórico do pedido ainda não está disponível.
				</p>
			</CardContent>
		</Card>
	);
};
