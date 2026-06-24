import { CheckCircle2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { ChatMessage } from '@/shared/chat/chat.types';
import { DashboardSubmitButton } from '@/shared/dashboard/dashboard-submit-button';
import { formatCurrency } from '@/shared/format/currency';
import { formatDate } from '@/shared/format/date';
import { formatOrderRoute } from '@/shared/format/orders';
import { getOrderRatings } from '@/shared/ratings/rating-actions';
import { RatingCard } from '@/shared/ratings/rating-card';
import type { RatingOutput } from '@/shared/ratings/rating-contracts';
import { OrderStatusBadge } from '@/shared/ui/components/status-badge';
import {
	completeBoosterOrderAction,
	getBoosterOrder,
	getBoosterOrderChatMessages,
	getBoosterUserId,
} from '../../actions/booster-actions';
import { toBoosterWork } from '../../model/booster-orders';
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

const isReadOnlyOrder = (status: string) =>
	status === 'completed' || status === 'cancelled';

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
	const isReadOnly = isReadOnlyOrder(order.status);

	let ratings: RatingOutput[] = [];
	if (order.status === 'completed') {
		ratings = await getOrderRatings(order.id);
	}

	return (
		<div className="space-y-8">
			<section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-3">
					<p className="text-[10px] font-black uppercase tracking-[0.2em] text-hextech-cyan">
						Pedido do booster
					</p>
					<h1 className="font-display text-3xl font-black text-white">
						{formatOrderRoute(order)}
					</h1>
					<p className="mt-2 font-mono text-xs text-white/35">{order.id}</p>
				</div>
				{isReadOnly ? null : (
					<form action={completeBoosterOrderAction.bind(null, order.id)}>
						<DashboardSubmitButton
							variant="outline"
							size="md"
							pendingLabel="Finalizando"
							className="gap-2"
						>
							<CheckCircle2 className="h-4 w-4" />
							Finalizar pedido
						</DashboardSubmitButton>
					</form>
				)}
			</section>

			<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
				<BoosterChatPanel
					orderId={order.id}
					orderLabel="Chat do pedido"
					currentUserId={currentUserId}
					initialMessages={chatMessages}
					isReadOnly={isReadOnly}
					statusText={isReadOnly ? 'Somente leitura' : 'Ativo'}
				/>

				<section className="grid content-start gap-4 sm:grid-cols-3 xl:grid-cols-1">
					<div className="rounded-sm border border-white/10 bg-white/[0.03] p-5">
						<p className="text-[9px] font-black uppercase tracking-widest text-white/35">
							Status
						</p>
						<div className="mt-2">
							<OrderStatusBadge status={order.status} />
						</div>
					</div>
					<div className="rounded-sm border border-white/10 bg-white/[0.03] p-5">
						<p className="text-[9px] font-black uppercase tracking-widest text-white/35">
							Prazo
						</p>
						<p className="mt-2 text-sm font-black text-white">
							{formatDate(order.deadline)}
						</p>
					</div>
					<div className="rounded-sm border border-white/10 bg-white/[0.03] p-5">
						<p className="text-[9px] font-black uppercase tracking-widest text-white/35">
							Repasse
						</p>
						<p className="mt-2 text-sm font-black text-hextech-gold">
							{formatCurrency(order.boosterAmount)}
						</p>
					</div>
					{order.status === 'completed' ? (
						<RatingCard
							orderId={order.id}
							currentUserId={currentUserId}
							initialRatings={ratings}
						/>
					) : null}
				</section>
			</div>
		</div>
	);
};
