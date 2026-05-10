'use client';

import { useCallback, useState, useTransition } from 'react';
import type { ChatMessage } from '@/shared/chat/chat.types';
import { ChatPanel } from '@/shared/chat/chat-panel';
import { sendOrderChatMessageAction } from '../../actions/order-actions';

type OrderChatPanelProps = {
	orderId: string;
	orderStatus: string;
	currentUserId: string;
	initialMessages: ChatMessage[];
};

const isReadOnlyStatus = (orderStatus: string) =>
	orderStatus === 'completed' || orderStatus === 'cancelled';

const getStatusText = (orderStatus: string) => {
	if (orderStatus === 'in_progress') return 'Ativo';
	if (isReadOnlyStatus(orderStatus)) return 'Somente leitura';

	return 'Aguardando aceite';
};

const getEmptyDescription = (orderStatus: string) => {
	if (orderStatus === 'in_progress') {
		return 'Envie a primeira mensagem para alinhar os detalhes deste pedido.';
	}

	if (isReadOnlyStatus(orderStatus)) {
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
	const isDisabled = orderStatus !== 'in_progress' || isPending;

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
				title="Chat do pedido"
				statusText={getStatusText(orderStatus)}
				emptyTitle="Nenhuma mensagem"
				emptyDescription={getEmptyDescription(orderStatus)}
				className="max-w-none"
			/>
			{error ? (
				<p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
					{error}
				</p>
			) : null}
		</div>
	);
};
