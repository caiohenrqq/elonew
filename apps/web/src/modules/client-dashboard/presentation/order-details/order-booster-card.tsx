import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@packages/ui/components/card';
import { Shield, User } from 'lucide-react';

export const OrderBoosterCard = () => {
	return (
		<Card className="border-hextech-cyan/10">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Shield className="w-4 h-4 text-hextech-cyan" />
					Seu Booster
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center">
						<User className="w-6 h-6 text-white/20" />
					</div>
					<div>
						<p className="text-xs font-black uppercase tracking-widest text-white">
							Booster não definido
						</p>
						<p className="text-[9px] text-hextech-cyan font-bold uppercase">
							Aguardando atualização
						</p>
					</div>
				</div>
				<p className="text-xs text-white/40 leading-relaxed">
					Quando um booster for atribuído ao pedido, as informações aparecerão
					aqui.
				</p>
			</CardContent>
		</Card>
	);
};
