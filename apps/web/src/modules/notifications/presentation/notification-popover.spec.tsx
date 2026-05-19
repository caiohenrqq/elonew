import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationPopover } from './notification-popover';

jest.mock('socket.io-client', () => ({
	io: jest.fn(() => ({
		close: jest.fn(),
		connect: jest.fn(),
		off: jest.fn(),
		on: jest.fn(),
	})),
}));

jest.mock('../actions/notification-actions', () => ({
	markAllDashboardNotificationsReadAction: jest.fn().mockResolvedValue({}),
	markDashboardNotificationReadAction: jest.fn().mockResolvedValue({
		notification: {
			id: 'notification-1',
			type: 'CHAT_MESSAGE_CREATED',
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: 'order-1',
					chatMessageId: 'message-1',
					senderId: 'booster-1',
					senderUsername: 'Booster',
				},
			},
			readAt: '2026-05-18T12:00:00.000Z',
			activityAt: '2026-05-18T11:00:00.000Z',
			createdAt: '2026-05-18T11:00:00.000Z',
			updatedAt: '2026-05-18T11:00:00.000Z',
		},
	}),
}));

const unreadNotifications = {
	items: [
		{
			id: 'notification-1',
			type: 'CHAT_MESSAGE_CREATED' as const,
			payload: {
				type: 'CHAT_MESSAGE_CREATED' as const,
				metadata: {
					orderId: 'order-1',
					chatMessageId: 'message-1',
					senderId: 'booster-1',
					senderUsername: 'Booster',
				},
			},
			readAt: null,
			activityAt: '2026-05-18T11:00:00.000Z',
			createdAt: '2026-05-18T11:00:00.000Z',
			updatedAt: '2026-05-18T11:00:00.000Z',
		},
	],
	nextCursor: null,
	unreadCount: 1,
};

describe('NotificationPopover', () => {
	it('renders unread notifications with the client order link', async () => {
		render(
			<NotificationPopover
				initialNotifications={unreadNotifications}
				viewerRole="CLIENT"
			/>,
		);

		await userEvent.click(
			screen.getByRole('button', { name: /abrir notificações/i }),
		);

		expect(screen.getByText('1 nova')).toBeInTheDocument();
		expect(
			screen.getByText(/Booster enviou uma mensagem/i),
		).toBeInTheDocument();
		expect(screen.getByRole('link')).toHaveAttribute(
			'href',
			'/client/orders/order-1',
		);
	});

	it('renders the empty state for admins', async () => {
		render(
			<NotificationPopover
				initialNotifications={{ items: [], nextCursor: null, unreadCount: 0 }}
				viewerRole="ADMIN"
			/>,
		);

		await userEvent.click(
			screen.getByRole('button', { name: /abrir notificações/i }),
		);

		expect(screen.getByText('Sem notificações')).toBeInTheDocument();
	});
});
