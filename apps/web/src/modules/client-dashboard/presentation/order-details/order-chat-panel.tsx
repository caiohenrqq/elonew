'use client';

import { useCallback, useState, useTransition } from 'react';
import type { ChatMessage } from '@/shared/chat/chat.types';
import { ChatPanel } from '@/shared/chat/chat-panel';
import { sendOrderChatMessageAction } from '../../actions/order-actions';
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
	const [messages, setMessages] = useState(initialMessages);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const isReadOnly = isReadOnlyOrderStatus(orderStatus);
	const isDisabled = orderStatus !== 'in_progress' || isPending;
	const copy = getOrderStageCopy(orderStatus);

	const handleSendMessage = useCallback(
		(content: string) => {
			setError(null);
			startTransition(async () => {
				const result = await sendOrderChatMessageAction(orderId, content);
				if (result.error) {
					setError(result.error);
					return;
				}
				const nextMessage = result.message;
				if (!nextMessage) return;

				setMessages((currentMessages) => [...currentMessages, nextMessage]);
			});
		},
		[orderId],
	);

	return (
		<div className="space-y-2">
			<ChatPanel
				messages={messages}
				currentUserId={currentUserId}
				onSendMessage={handleSendMessage}
				isSending={isPending}
				isDisabled={isDisabled}
				isReadOnly={isReadOnly}
				title="Chat do pedido"
				statusText={copy.chatStatus}
				emptyTitle="Nenhuma mensagem"
				emptyDescription={getEmptyDescription(orderStatus)}
				className={orderDetailsLayout.chat}
			/>
			{error ? (
				<p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
					{error}
				</p>
			) : null}
		</div>
	);
};
