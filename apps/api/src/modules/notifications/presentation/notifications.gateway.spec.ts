import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import type { AuthenticateAccessTokenUseCase } from '@modules/auth/application/use-cases/authenticate-access-token/authenticate-access-token.use-case';
import { InvalidAccessTokenError } from '@modules/auth/domain/auth.errors';
import type { WebSessionCookieService } from '@modules/auth/infrastructure/security/web-session-cookie.service';
import type { NotificationResponse } from '@modules/notifications/application/use-cases/notification-response';
import { NotificationsGateway } from '@modules/notifications/presentation/notifications.gateway';
import { Role } from '@packages/auth/roles/role';

class AuthenticateAccessTokenStub {
	constructor(
		private readonly result: AuthenticatedUser | Error,
		private readonly rejection: Error | null = null,
	) {}

	async execute(): Promise<AuthenticatedUser> {
		if (this.rejection) throw this.rejection;
		if (this.result instanceof Error) throw this.result;
		return this.result;
	}

	async ensureUsable(userId: string): Promise<AuthenticatedUser> {
		if (this.rejection) throw this.rejection;
		// An invalid bearer token does not invalidate a cookie session.
		if (this.result instanceof Error) return { id: userId, role: Role.CLIENT };
		return { id: userId, role: this.result.role };
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
	rejection: Error | null = null,
) => {
	const webSessionCookieService = new WebSessionCookieServiceStub();
	const emittedToRooms: Array<{
		room: string;
		event: string;
		payload: unknown;
	}> = [];
	const gateway = new NotificationsGateway(
		new AuthenticateAccessTokenStub(
			user,
			rejection,
		) as unknown as AuthenticateAccessTokenUseCase,
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
	])('authenticates %s connections and joins a recipient room', async (role) => {
		const { gateway } = makeGateway({ id: 'user-1', role });
		const socket = new NotificationSocketStub();
		socket.handshake.auth.token = 'Bearer valid-token';

		await gateway.handleConnection(socket as never);

		expect(socket.data.user).toEqual({ id: 'user-1', role });
		expect(socket.joinedRooms).toEqual(['user:user-1:notifications']);
		expect(socket.emitted).toContainEqual({
			event: 'notifications:connected',
			payload: { userId: 'user-1' },
		});
	});

	it('disconnects unauthenticated connections', async () => {
		const { gateway } = makeGateway(new InvalidAccessTokenError());
		const socket = new NotificationSocketStub();
		socket.handshake.auth.token = 'invalid-token';

		await gateway.handleConnection(socket as never);

		expect(socket.disconnectCalled).toBe(true);
		expect(socket.emitted).toContainEqual({
			event: 'notifications:error',
			payload: {
				code: 'INVALID_ACCESS_TOKEN',
				message: 'Invalid access token.',
			},
		});
	});

	it('authenticates browser connections with the web session cookie', async () => {
		const { gateway, webSessionCookieService } = makeGateway(
			new InvalidAccessTokenError(),
		);
		const socket = new NotificationSocketStub();
		socket.handshake.headers.cookie = 'elonew.session=sealed-session';
		webSessionCookieService.user = { id: 'client-cookie', role: Role.CLIENT };

		await gateway.handleConnection(socket as never);

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
