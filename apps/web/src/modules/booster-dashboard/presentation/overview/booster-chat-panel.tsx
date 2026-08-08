'use client';

import type { ChatMessage } from '@/shared/chat/chat.types';
import { ChatPanel } from '@/shared/chat/chat-panel';
import { useLiveOrderChat } from '@/shared/chat/use-live-order-chat';

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
	const { isSending, liveError, messages, sendMessage } = useLiveOrderChat({
		orderId,
		initialMessages,
		enabled: !isReadOnly,
	});

	return (
		<div className="space-y-2">
			<ChatPanel
				messages={messages}
				currentUserId={currentUserId}
				onSendMessage={sendMessage}
				isSending={isSending}
				isDisabled={isSending || isReadOnly}
				isReadOnly={isReadOnly}
				title={orderLabel}
				statusText={statusText}
				emptyTitle="Nenhuma mensagem"
				emptyDescription="Envie a primeira mensagem para alinhar este pedido com o cliente."
				className="h-[min(720px,calc(100dvh-15rem))] min-h-130 max-w-none"
			/>
			{liveError ? (
				<p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
					{liveError}
				</p>
			) : null}
		</div>
	);
};
