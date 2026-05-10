'use client';

import { Badge } from '@packages/ui/components/badge';
import { cn } from '@packages/ui/utils/cn';
import {
	type CSSProperties,
	type FC,
	memo,
	useEffect,
	useMemo,
	useRef,
} from 'react';
import type { ChatMessage, ChatRoleLabel } from './chat.types';

interface ChatMessageListProps {
	messages: ChatMessage[];
	currentUserId: string;
	className?: string;
	emptyTitle?: string;
	emptyDescription?: string;
}

export const ChatMessageList: FC<ChatMessageListProps> = ({
	messages,
	currentUserId,
	className,
	emptyTitle = 'Nenhuma mensagem',
	emptyDescription = 'As mensagens deste pedido aparecerão aqui.',
}) => {
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = scrollRef.current;
		if (element && messages.length > 0) {
			element.scrollTop = element.scrollHeight;
		}
	}, [messages.length]);

	if (messages.length === 0) {
		return (
			<div
				className={cn(
					'flex h-full items-center justify-center p-8 text-center',
					className,
				)}
			>
				<div className="max-w-[200px] space-y-2">
					<p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
						{emptyTitle}
					</p>
					<p className="text-[10px] leading-relaxed text-white/35">
						{emptyDescription}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={scrollRef}
			style={{ contentVisibility: 'auto' } as CSSProperties}
			className={cn(
				'flex flex-col gap-4 overflow-y-auto p-4 scrollbar-hide',
				className,
			)}
		>
			{messages.map((message) => {
				const isMe = message.sender.id === currentUserId;

				return (
					<ChatMessageItem key={message.id} message={message} isMe={isMe} />
				);
			})}
		</div>
	);
};

interface ChatMessageItemProps {
	message: ChatMessage;
	isMe: boolean;
}

const ROLE_VARIANTS = {
	CLIENT: 'default',
	BOOSTER: 'warning',
	ADMIN: 'error',
} as const;

const ROLE_LABELS: ChatRoleLabel = {
	ADMIN: 'Admin',
	BOOSTER: 'Booster',
	CLIENT: 'Cliente',
};

const ChatMessageItem = memo(({ message, isMe }: ChatMessageItemProps) => {
	const timeString = useMemo(() => {
		return new Date(message.createdAt).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		});
	}, [message.createdAt]);

	return (
		<div
			className={cn(
				'flex flex-col max-w-[85%]',
				isMe ? 'ml-auto items-end' : 'mr-auto items-start',
			)}
		>
			<div className="flex items-center gap-2 mb-1">
				{!isMe && (
					<span className="text-[10px] font-black uppercase tracking-wider text-white/40">
						{message.sender.username}
					</span>
				)}
				<Badge
					variant={ROLE_VARIANTS[message.sender.role]}
					className="h-4 px-1 text-[8px]"
				>
					{ROLE_LABELS[message.sender.role]}
				</Badge>
				{isMe && (
					<span className="text-[10px] font-black uppercase tracking-wider text-white/40">
						Você
					</span>
				)}
			</div>
			<div
				className={cn(
					'rounded-sm border px-3 py-2 text-xs leading-relaxed break-words w-full',
					isMe
						? 'border-hextech-cyan/20 bg-hextech-cyan/5 text-white/90'
						: 'border-white/10 bg-white/5 text-white/70',
				)}
			>
				{message.content}
			</div>
			<span className="mt-1 text-[8px] font-medium uppercase tracking-widest text-white/20">
				{timeString}
			</span>
		</div>
	);
});

ChatMessageItem.displayName = 'ChatMessageItem';
