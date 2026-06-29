'use client';

import { useCallback, useState, useTransition } from 'react';
import type { ChatMessage } from '@/shared/chat/chat.types';
import { ChatPanel } from '@/shared/chat/chat-panel';
import { sendBoosterOrderChatMessageAction } from '../../actions/booster-actions';

type BoosterChatPanelProps = {
	orderId: string;
	orderLabel: string;
	currentUserId: string;
	initialMessages: ChatMessage[];
	isReadOnly?: boolean;
	statusText?: string;
};

export const BoosterChatPanel = ({
	orderId,
	orderLabel,
	currentUserId,
	initialMessages,
	isReadOnly,
	statusText = 'Ativo',
}: BoosterChatPanelProps) => {
	const [messages, setMessages] = useState(initialMessages);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSendMessage = useCallback(
		(content: string) => {
			setError(null);
			startTransition(async () => {
				const result = await sendBoosterOrderChatMessageAction(
					orderId,
					content,
				);
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
				isDisabled={isPending || isReadOnly}
				isReadOnly={isReadOnly}
				title={orderLabel}
				statusText={statusText}
				emptyTitle="Nenhuma mensagem"
				emptyDescription="Envie a primeira mensagem para alinhar este pedido com o cliente."
				className="h-[min(720px,calc(100dvh-15rem))] min-h-130 max-w-none"
			/>
			{error ? (
				<p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
					{error}
				</p>
			) : null}
		</div>
	);
};
