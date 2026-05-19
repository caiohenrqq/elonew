import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import type { AccessTokenServicePort } from '@modules/auth/application/ports/token-service.port';
import { InvalidAccessTokenError } from '@modules/auth/domain/auth.errors';
import type { WebSessionCookieService } from '@modules/auth/infrastructure/security/web-session-cookie.service';
import type { NotificationResponse } from '@modules/notifications/application/use-cases/notification-response';
import { NotificationsGateway } from '@modules/notifications/presentation/notifications.gateway';
import { Role } from '@packages/auth/roles/role';

class AccessTokenVerifierStub implements AccessTokenServicePort {
	constructor(private readonly user: AuthenticatedUser | Error) {}

	sign(): { token: string; expiresInSeconds: number } {
		return { token: 'token', expiresInSeconds: 900 };
	}

	verify(): AuthenticatedUser {
		if (this.user instanceof Error) throw this.user;
		return this.user;
	}
}

class WebSessionCookieServiceStub {
	user: AuthenticatedUser | null = null;

	verifyCookieHeader(): AuthenticatedUser | null {
		return this.user;
	}
}

class NotificationSocketStub {
	readonly data: Record<string, unknown> = {};
	readonly emitted: Array<{ event: string; payload: unknown }> = [];
	readonly joinedRooms: string[] = [];
	disconnectCalled = false;
	handshake = {
		auth: {} as Record<string, unknown>,
		headers: {} as Record<string, string | undefined>,
	};

	emit(event: string, payload: unknown): void {
		this.emitted.push({ event, payload });
	}

	async join(room: string): Promise<void> {
		this.joinedRooms.push(room);
	}

	disconnect(): void {
		this.disconnectCalled = true;
	}
}

const makeGateway = (
	user: AuthenticatedUser | Error = { id: 'client-1', role: Role.CLIENT },
) => {
	const webSessionCookieService = new WebSessionCookieServiceStub();
	const emittedToRooms: Array<{
		room: string;
		event: string;
		payload: unknown;
	}> = [];
	const gateway = new NotificationsGateway(
		new AccessTokenVerifierStub(user),
		webSessionCookieService as unknown as WebSessionCookieService,
	);
	(
		gateway as unknown as {
			server: {
				to(room: string): { emit(event: string, payload: unknown): void };
			};
		}
	).server = {
		to(room: string) {
			return {
				emit(event: string, payload: unknown) {
					emittedToRooms.push({ room, event, payload });
				},
			};
		},
	};

	return { emittedToRooms, gateway, webSessionCookieService };
};

describe('NotificationsGateway', () => {
	it.each([
		Role.CLIENT,
		Role.BOOSTER,
		Role.ADMIN,
	])('authenticates %s connections and joins a recipient room', (role) => {
		const { gateway } = makeGateway({ id: 'user-1', role });
		const socket = new NotificationSocketStub();
		socket.handshake.auth.token = 'Bearer valid-token';

		gateway.handleConnection(socket as never);

		expect(socket.data.user).toEqual({ id: 'user-1', role });
		expect(socket.joinedRooms).toEqual(['user:user-1:notifications']);
		expect(socket.emitted).toContainEqual({
			event: 'notifications:connected',
			payload: { userId: 'user-1' },
		});
	});

	it('disconnects unauthenticated connections', () => {
		const { gateway } = makeGateway(new InvalidAccessTokenError());
		const socket = new NotificationSocketStub();
		socket.handshake.auth.token = 'invalid-token';

		gateway.handleConnection(socket as never);

		expect(socket.disconnectCalled).toBe(true);
		expect(socket.emitted).toContainEqual({
			event: 'notifications:error',
			payload: {
				code: 'INVALID_ACCESS_TOKEN',
				message: 'Invalid access token.',
			},
		});
	});

	it('authenticates browser connections with the web session cookie', () => {
		const { gateway, webSessionCookieService } = makeGateway(
			new InvalidAccessTokenError(),
		);
		const socket = new NotificationSocketStub();
		socket.handshake.headers.cookie = 'elonew.session=sealed-session';
		webSessionCookieService.user = { id: 'client-cookie', role: Role.CLIENT };

		gateway.handleConnection(socket as never);

		expect(socket.data.user).toEqual({
			id: 'client-cookie',
			role: Role.CLIENT,
		});
		expect(socket.joinedRooms).toEqual(['user:client-cookie:notifications']);
		expect(socket.disconnectCalled).toBe(false);
	});

	it('emits notification updates only to the recipient room', () => {
		const { emittedToRooms, gateway } = makeGateway();
		const notification: NotificationResponse = {
			id: 'notification-1',
			type: 'CHAT_MESSAGE_CREATED',
			payload: {
				type: 'CHAT_MESSAGE_CREATED',
				metadata: {
					orderId: 'order-1',
					chatMessageId: 'message-1',
					senderId: 'client-1',
					senderUsername: 'Client',
				},
			},
			readAt: null,
			activityAt: '2026-05-18T12:00:00.000Z',
			createdAt: '2026-05-18T12:00:00.000Z',
			updatedAt: '2026-05-18T12:00:00.000Z',
		};

		gateway.emitNotificationUpdated('booster-1', {
			notification,
			unreadCount: 1,
		});

		expect(emittedToRooms).toEqual([
			{
				room: 'user:booster-1:notifications',
				event: 'notifications:updated',
				payload: { notification, unreadCount: 1 },
			},
		]);
	});

	it('emits read-all updates only to the recipient room', () => {
		const { emittedToRooms, gateway } = makeGateway();

		gateway.emitNotificationsReadAll('client-1', {
			cutoffActivityAt: '2026-05-18T12:00:00.000Z',
			readAt: '2026-05-18T12:00:00.000Z',
			unreadCount: 0,
		});

		expect(emittedToRooms).toEqual([
			{
				room: 'user:client-1:notifications',
				event: 'notifications:read-all',
				payload: {
					cutoffActivityAt: '2026-05-18T12:00:00.000Z',
					readAt: '2026-05-18T12:00:00.000Z',
					unreadCount: 0,
				},
			},
		]);
	});
});
