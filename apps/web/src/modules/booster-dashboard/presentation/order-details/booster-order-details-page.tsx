import { notFound } from 'next/navigation';
import type { ChatMessage } from '@/shared/chat/chat.types';
import {
	getBoosterOrder,
	getBoosterOrderChatMessages,
	getBoosterUserId,
} from '../../actions/booster-actions';
import {
	formatCurrency,
	formatDate,
	formatOrderRoute,
	toBoosterWork,
} from '../../model/booster-orders';
import type { BoosterOrderOutput } from '../../server/booster-contracts';
import { BoosterChatPanel } from '../overview/booster-chat-panel';

type BoosterOrderDetailsPageProps = {
	orderId: string;
};

const toSingleOrderWork = (order: BoosterOrderOutput) =>
	toBoosterWork({
		activeOrders: [order],
		recentCompletedOrders: [],
		summary: {
			activeOrders: 1,
			completedOrders: 0,
			earnedFromRecentCompletions: 0,
		},
	}).activeOrders[0];

export const BoosterOrderDetailsPage = async ({
	orderId,
}: BoosterOrderDetailsPageProps) => {
	const [orderOutput, currentUserId, chatResult] = await Promise.all([
		getBoosterOrder(orderId),
		getBoosterUserId(),
		getBoosterOrderChatMessages(orderId),
	]);
	if (!orderOutput) notFound();

	const order = toSingleOrderWork(orderOutput);
	const chatMessages: ChatMessage[] = chatResult.items;

	return (
		<div className="space-y-8">
			<section className="space-y-3">
				<p className="text-[10px] font-black uppercase tracking-[0.2em] text-hextech-cyan">
					Pedido em execução
				</p>
				<div>
					<h1 className="font-display text-3xl font-black text-white">
						{formatOrderRoute(order)}
					</h1>
					<p className="mt-2 font-mono text-xs text-white/35">{order.id}</p>
				</div>
			</section>

			<div className="grid gap-8 lg:grid-cols-[1fr_380px]">
				<section className="grid gap-4 sm:grid-cols-3">
					<div className="border border-white/5 bg-white/5 p-5">
						<p className="text-[9px] font-black uppercase tracking-widest text-white/35">
							Status
						</p>
						<p className="mt-2 text-sm font-black uppercase tracking-widest text-white">
							{order.statusLabel}
						</p>
					</div>
					<div className="border border-white/5 bg-white/5 p-5">
						<p className="text-[9px] font-black uppercase tracking-widest text-white/35">
							Prazo
						</p>
						<p className="mt-2 text-sm font-black text-white">
							{formatDate(order.deadline)}
						</p>
					</div>
					<div className="border border-white/5 bg-white/5 p-5">
						<p className="text-[9px] font-black uppercase tracking-widest text-white/35">
							Repasse
						</p>
						<p className="mt-2 text-sm font-black text-hextech-gold">
							{formatCurrency(order.boosterAmount)}
						</p>
					</div>
				</section>

				<BoosterChatPanel
					orderId={order.id}
					orderLabel={formatOrderRoute(order)}
					currentUserId={currentUserId}
					initialMessages={chatMessages}
				/>
			</div>
		</div>
	);
};
