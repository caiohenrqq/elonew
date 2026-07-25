import { Shield, User } from 'lucide-react';
import Image from 'next/image';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/shared/ui/components/card';
import { cn } from '@/shared/ui/utils/cn';
import type { ClientOrder } from '../../model/orders';
import { orderDetailsLayout } from './order-details-layout';

export const OrderBoosterCard = ({
	booster,
}: {
	booster: ClientOrder['booster'];
}) => {
	return (
		<Card className={cn(orderDetailsLayout.railCard, 'border-hextech-cyan/10')}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Shield className="w-4 h-4 text-hextech-cyan" />
					Seu Booster
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-sm border border-white/10 bg-white/5">
						{booster?.avatarUrl ? (
							<Image
								src={booster.avatarUrl}
								alt=""
								width={48}
								height={48}
								unoptimized
								className="h-full w-full object-cover"
							/>
						) : (
							<User className="w-6 h-6 text-white/20" />
						)}
					</div>
					<div>
						<p className="text-xs font-black uppercase tracking-widest text-white">
							{booster?.username ?? 'Booster não definido'}
						</p>
						<p className="text-[9px] text-hextech-cyan font-bold uppercase">
							{booster
								? `Reputação ${booster.reputation.toLocaleString('pt-BR')}`
								: 'Aguardando atualização'}
						</p>
					</div>
				</div>
				<p className="text-xs text-white/40 leading-relaxed">
					{booster
						? 'Booster responsável por este pedido.'
						: 'Quando um booster for atribuído ao pedido, as informações aparecerão aqui.'}
				</p>
			</CardContent>
		</Card>
	);
};
