'use client';

import { panelSurface } from '@packages/ui/styles/classes';
import { cn } from '@packages/ui/utils/cn';
import { type FC } from 'react';
import type { ChatMessage } from './chat.types';
import { ChatComposer } from './chat-composer';
import { ChatMessageList } from './chat-message-list';

interface ChatPanelProps {
	messages: ChatMessage[];
	currentUserId: string;
	onSendMessage?: (content: string) => void;
	isLoading?: boolean;
	isSending?: boolean;
	isDisabled?: boolean;
	isReadOnly?: boolean;
	title?: string;
	statusText?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	className?: string;
}

export const ChatPanel: FC<ChatPanelProps> = ({
	messages,
	currentUserId,
	onSendMessage,
	isLoading,
	isSending,
	isDisabled,
	isReadOnly,
	title = 'Chat do pedido',
	statusText,
	emptyTitle,
	emptyDescription,
	className,
}) => {
	return (
		<div
			className={cn(
				panelSurface.base,
				'flex flex-col h-[500px] w-full max-w-md overflow-hidden',
				className,
			)}
		>
			<div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-white/[0.02]">
				<h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
					{title}
				</h3>
				{statusText ? (
					<p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
						{statusText}
					</p>
				) : null}
				{isLoading ? (
					<div className="h-3 w-3 animate-spin rounded-full border border-hextech-cyan border-t-transparent" />
				) : null}
			</div>
			<div className="flex-1 overflow-hidden relative">
				<ChatMessageList
					messages={messages}
					currentUserId={currentUserId}
					emptyTitle={emptyTitle}
					emptyDescription={emptyDescription}
					className="h-full"
				/>
				{isLoading && messages.length > 0 && (
					<div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center" />
				)}
			</div>
			{isReadOnly ? null : (
				<ChatComposer
					onSend={onSendMessage ?? (() => undefined)}
					isDisabled={isDisabled}
					isSending={isSending}
				/>
			)}
		</div>
	);
};
