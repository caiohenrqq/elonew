import { notFound, redirect } from 'next/navigation';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { getAuthSession } from '@/shared/auth/session';
import type { ChatMessage } from '@/shared/chat/chat.types';
import { getOrderRatings } from '@/shared/ratings/rating-actions';
import { RatingCard } from '@/shared/ratings/rating-card';
import type { RatingOutput } from '@/shared/ratings/rating-contracts';
import { getOrder, getOrderChatMessages } from '../../actions/order-actions';
import type { ClientOrder } from '../../model/orders';
import { OrderActivityCard } from './order-activity-card';
import { OrderBoosterCard } from './order-booster-card';
import { OrderChatPanel } from './order-chat-panel';
import { OrderDetailsHeader } from './order-details-header';
import { OrderServiceCard } from './order-service-card';
import { OrderSupportCard } from './order-support-card';

type OrderDetailsPageProps = {
	orderId: string;
};

export const OrderDetailsPage = async ({ orderId }: OrderDetailsPageProps) => {
	let order: ClientOrder;
	let chatMessages: ChatMessage[];

	try {
		const [orderResult, chatResult] = await Promise.all([
			getOrder(orderId),
			getOrderChatMessages(orderId),
		]);
		order = orderResult;
		chatMessages = chatResult.items;
	} catch (error) {
		if (error instanceof ApiRequestError) {
			if (error.status === 401 || error.status === 403) redirect('/login');
			if (error.status === 404) notFound();
		}

		throw error;
	}
	const session = await getAuthSession();
	if (!session?.userId) redirect('/login');

	let ratings: RatingOutput[] = [];
	if (order.status === 'completed') {
		ratings = await getOrderRatings(order.id);
	}

	return (
		<div className="space-y-8">
			<OrderDetailsHeader order={order} />

			<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
				<OrderChatPanel
					orderId={order.id}
					orderStatus={order.status}
					currentUserId={session.userId}
					initialMessages={chatMessages}
				/>

				<div className="grid content-start gap-8">
					<OrderServiceCard order={order} />
					<OrderBoosterCard />
					<OrderActivityCard />
					<OrderSupportCard />
					{order.status === 'completed' ? (
						<RatingCard
							orderId={order.id}
							currentUserId={session.userId}
							initialRatings={ratings}
						/>
					) : null}
				</div>
			</div>
		</div>
	);
};
