'use client';

import type { ChatMessage } from '@/shared/chat/chat.types';
import { ChatPanel } from '@/shared/chat/chat-panel';
import { useLiveOrderChat } from '@/shared/chat/use-live-order-chat';
import { orderDetailsLayout } from './order-details-layout';
import { getOrderStageCopy, isReadOnlyOrderStatus } from './order-stage-copy';

type OrderChatPanelProps = {
	orderId: string;
	orderStatus: string;
	currentUserId: string;
	initialMessages: ChatMessage[];
};

const getEmptyDescription = (orderStatus: string) => {
	if (orderStatus === 'in_progress') {
		return 'Envie a primeira mensagem para alinhar os detalhes deste pedido.';
	}

	if (isReadOnlyOrderStatus(orderStatus)) {
		return 'Nenhuma conversa foi registrada para este pedido.';
	}

	return 'O chat será aberto quando um booster aceitar este pedido.';
};

export const OrderChatPanel = ({
	orderId,
	orderStatus,
	currentUserId,
	initialMessages,
}: OrderChatPanelProps) => {
	const isReadOnly = isReadOnlyOrderStatus(orderStatus);
	const copy = getOrderStageCopy(orderStatus);
	const { isSending, liveError, messages, sendMessage } = useLiveOrderChat({
		orderId,
		initialMessages,
		enabled: orderStatus === 'in_progress',
	});

	return (
		<div className="space-y-2">
			<ChatPanel
				messages={messages}
				currentUserId={currentUserId}
				onSendMessage={sendMessage}
				isSending={isSending}
				isDisabled={orderStatus !== 'in_progress' || isSending}
				isReadOnly={isReadOnly}
				title="Chat do pedido"
				statusText={copy.chatStatus}
				emptyTitle="Nenhuma mensagem"
				emptyDescription={getEmptyDescription(orderStatus)}
				className={orderDetailsLayout.chat}
			/>
			{liveError ? (
				<p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
					{liveError}
				</p>
			) : null}
		</div>
	);
};
