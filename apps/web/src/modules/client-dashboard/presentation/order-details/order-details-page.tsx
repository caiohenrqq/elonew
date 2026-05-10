import { notFound, redirect } from 'next/navigation';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { getAuthSession } from '@/shared/auth/session';
import type { ChatMessage } from '@/shared/chat/chat.types';
import { getOrder, getOrderChatMessages } from '../../actions/order-actions';
import { type ClientOrder, toClientOrder } from '../../model/orders';
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
		order = toClientOrder(orderResult);
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

	return (
		<div className="space-y-8">
			<OrderDetailsHeader order={order} />

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-8">
					<OrderServiceCard order={order} />
					<OrderActivityCard />
				</div>

				<div className="space-y-8">
					<OrderBoosterCard />
					<OrderChatPanel
						orderId={order.id}
						orderStatus={order.status}
						currentUserId={session.userId}
						initialMessages={chatMessages}
					/>
					<OrderSupportCard />
				</div>
			</div>
		</div>
	);
};
