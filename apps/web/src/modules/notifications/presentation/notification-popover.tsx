'use client';

import { Bell, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type {
	ListNotificationsResponse,
	NotificationOutput,
} from '@/shared/notifications/notification-contracts';
import { cn } from '@/shared/ui/utils/cn';
import {
	markAllDashboardNotificationsReadAction,
	markDashboardNotificationReadAction,
} from '../actions/notification-actions';
import { useLiveNotifications } from './use-live-notifications';

type NotificationPopoverProps = {
	initialNotifications: ListNotificationsResponse;
	viewerRole: 'CLIENT' | 'BOOSTER' | 'ADMIN';
};

export const NotificationPopover = ({
	initialNotifications,
	viewerRole,
}: NotificationPopoverProps) => {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [pendingNotificationId, setPendingNotificationId] = useState<
		string | null
	>(null);
	const [isPending, startTransition] = useTransition();
	const {
		liveError,
		notifications,
		refetchNotifications,
		setLiveError,
		setNotifications,
	} = useLiveNotifications(initialNotifications);
	const visibleUnreadCount = notifications.unreadCount;
	const unreadLabel =
		visibleUnreadCount > 9 ? '9+' : String(visibleUnreadCount);

	const hasNotifications = notifications.items.length > 0;
	const summary =
		visibleUnreadCount === 0
			? 'Tudo lido'
			: visibleUnreadCount === 1
				? '1 nova'
				: `${visibleUnreadCount} novas`;

	const markOneRead = async (notificationId: string) => {
		const targetNotification = notifications.items.find(
			(notification) => notification.id === notificationId,
		);
		if (!targetNotification) return;

		setLiveError(null);
		setPendingNotificationId(notificationId);
		const result = await markDashboardNotificationReadAction(
			notificationId,
			targetNotification.activityAt,
		);
		setPendingNotificationId(null);
		if (result.error) {
			setLiveError(result.error);
			if (result.conflict) await refetchNotifications();
			return;
		}

		setNotifications((current) => ({
			...current,
			unreadCount: Math.max(
				current.unreadCount - (targetNotification.readAt ? 0 : 1),
				0,
			),
			items: current.items.map((notification) =>
				notification.id === notificationId && result.notification
					? result.notification
					: notification,
			),
		}));
	};

	const openNotification = async (notification: NotificationOutput) => {
		if (!notification.readAt) await markOneRead(notification.id);
		setIsOpen(false);
		router.push(getNotificationHref(notification, viewerRole));
	};

	const markAllRead = () => {
		setLiveError(null);
		startTransition(async () => {
			const result = await markAllDashboardNotificationsReadAction();
			if (result.error) {
				setLiveError(result.error);
				return;
			}

			const readAt = new Date().toISOString();
			const cutoffActivityAt = result.cutoffActivityAt ?? readAt;
			const unreadCount = result.unreadCount ?? 0;
			setNotifications((current) => ({
				...current,
				unreadCount,
				items: current.items.map((notification) => ({
					...notification,
					readAt:
						notification.readAt ??
						(new Date(notification.activityAt).getTime() <=
						new Date(cutoffActivityAt).getTime()
							? readAt
							: null),
				})),
			}));
		});
	};

	return (
		<div className="relative">
			<button
				type="button"
				aria-label="Abrir notificações"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((current) => !current)}
				className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-hextech-cyan/40 hover:text-white"
			>
				<Bell className="h-4 w-4" />
				{visibleUnreadCount > 0 ? (
					<span className="-right-1 -top-1 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-hextech-cyan px-1 text-[8px] font-black text-black">
						{unreadLabel}
					</span>
				) : null}
			</button>

			{isOpen ? (
				<div className="absolute right-0 mt-3 w-[min(calc(100vw-2rem),360px)] border border-white/10 bg-background shadow-panel">
					<div className="flex items-center justify-between border-white/5 border-b p-4">
						<div>
							<p className="text-[9px] font-black uppercase tracking-widest text-white/40">
								Notificações
							</p>
							<p className="text-xs font-black uppercase tracking-widest text-white">
								{summary}
							</p>
						</div>
						<button
							type="button"
							onClick={markAllRead}
							disabled={isPending || visibleUnreadCount === 0}
							className="cursor-pointer text-[9px] font-black uppercase tracking-widest text-hextech-cyan disabled:cursor-not-allowed disabled:text-white/20"
						>
							Ler todas
						</button>
					</div>

					<div className="max-h-[min(420px,calc(100vh-6rem))] overflow-y-auto">
						{liveError ? (
							<div className="border-red-400/20 border-b bg-red-500/10 px-4 py-3 text-[10px] font-semibold text-red-200">
								{liveError}
							</div>
						) : null}

						{isPending && !pendingNotificationId ? (
							<div className="flex items-center gap-2 border-white/5 border-b px-4 py-3 text-[10px] text-white/50">
								<Loader2 className="h-3 w-3 animate-spin" />
								Atualizando notificações
							</div>
						) : null}

						{hasNotifications ? (
							notifications.items.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									isPending={pendingNotificationId === notification.id}
									onOpen={openNotification}
								/>
							))
						) : (
							<div className="px-4 py-10 text-center">
								<p className="text-[10px] font-black uppercase tracking-widest text-white/50">
									Sem notificações
								</p>
								<p className="mt-2 text-xs text-white/35">
									Novas mensagens do chat aparecerão aqui.
								</p>
							</div>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
};

type NotificationItemProps = {
	notification: NotificationOutput;
	isPending: boolean;
	onOpen: (notification: NotificationOutput) => void;
};

const NotificationItem = ({
	notification,
	isPending,
	onOpen,
}: NotificationItemProps) => {
	const isUnread = !notification.readAt;

	return (
		<button
			type="button"
			onClick={() => onOpen(notification)}
			disabled={isPending}
			className={cn(
				'grid w-full cursor-pointer grid-cols-[1fr_auto] gap-3 border-white/5 border-b p-4 text-left disabled:cursor-wait',
				isUnread ? 'bg-hextech-cyan/5' : 'bg-transparent',
			)}
		>
			<div className="min-w-0">
				<p className="truncate text-[10px] font-black uppercase tracking-widest text-white">
					Nova mensagem no pedido
				</p>
				<p className="mt-1 line-clamp-2 text-xs text-white/50">
					{notification.payload.metadata.senderUsername} enviou uma mensagem.
				</p>
			</div>
			{isPending ? (
				<Loader2 className="h-3 w-3 animate-spin self-center" />
			) : isUnread ? (
				<Check className="h-3 w-3 self-center text-hextech-cyan" />
			) : null}
		</button>
	);
};

const getNotificationHref = (
	notification: NotificationOutput,
	role: NotificationPopoverProps['viewerRole'],
): string => {
	const orderId = notification.payload.metadata.orderId;
	if (role === 'BOOSTER')
		return `/booster/orders/${encodeURIComponent(orderId)}`;
	if (role === 'CLIENT') return `/client/orders/${encodeURIComponent(orderId)}`;
	return '/admin/support';
};
