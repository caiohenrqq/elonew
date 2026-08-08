'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getPublicApiBaseUrl } from '@/shared/env/public-env';
import type { ChatMessage } from './chat.types';
import {
	chatMessageSchema,
	sendChatMessageInputSchema,
} from './chat-contracts';

const CHAT_NAMESPACE = '/chat';

type UseLiveOrderChatInput = {
	orderId: string;
	initialMessages: ChatMessage[];
	enabled: boolean;
};

export const useLiveOrderChat = ({
	orderId,
	initialMessages,
	enabled,
}: UseLiveOrderChatInput) => {
	const [messages, setMessages] = useState(initialMessages);
	const [liveError, setLiveError] = useState<string | null>(null);
	const [isSending, setIsSending] = useState(false);
	const socketRef = useRef<Socket | null>(null);
	const hasConnected = useRef(false);
	const router = useRouter();

	const appendMessage = useCallback((message: ChatMessage) => {
		setMessages((current) =>
			current.some(({ id }) => id === message.id)
				? current
				: [...current, message],
		);
	}, []);

	useEffect(() => {
		setMessages((current) => [
			...current,
			...initialMessages.filter(
				(message) => !current.some(({ id }) => id === message.id),
			),
		]);
	}, [initialMessages]);

	useEffect(() => {
		if (!enabled) return;

		const socket = io(`${getPublicApiBaseUrl()}${CHAT_NAMESPACE}`, {
			withCredentials: true,
			transports: ['websocket', 'polling'],
		});
		socketRef.current = socket;
		const join = () => {
			socket.emit('chat:join', { orderId });
			if (hasConnected.current) router.refresh();
			hasConnected.current = true;
		};
		const receive = (payload: unknown) => {
			const parsed = chatMessageSchema.safeParse(payload);
			if (!parsed.success || parsed.data.orderId !== orderId) return;
			appendMessage(parsed.data);
			setIsSending(false);
		};
		const handleError = () => {
			setIsSending(false);
			setLiveError('Não foi possível atualizar o chat em tempo real.');
		};

		socket.on('connect', join);
		socket.on('chat:message.created', receive);
		socket.on('chat:error', handleError);

		return () => {
			socketRef.current = null;
			socket.off('connect', join);
			socket.off('chat:message.created', receive);
			socket.off('chat:error', handleError);
			socket.close();
		};
	}, [appendMessage, enabled, orderId, router]);

	const sendMessage = useCallback(
		(content: string) => {
			const parsed = sendChatMessageInputSchema.safeParse({ content });
			if (!parsed.success || !socketRef.current?.connected) {
				setLiveError('Não foi possível enviar a mensagem.');
				return;
			}

			setLiveError(null);
			setIsSending(true);
			socketRef.current.emit('chat:send', { orderId, ...parsed.data });
		},
		[orderId],
	);

	return { isSending, liveError, messages, sendMessage };
};
