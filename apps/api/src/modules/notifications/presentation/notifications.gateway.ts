import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import {
	ACCESS_TOKEN_SERVICE_KEY,
	type AccessTokenServicePort,
} from '@modules/auth/application/ports/token-service.port';
import {
	AuthenticationRequiredError,
	InsufficientPermissionsError,
	InvalidAccessTokenError,
} from '@modules/auth/domain/auth.errors';
import { WebSessionCookieService } from '@modules/auth/infrastructure/security/web-session-cookie.service';
import type { NotificationEventsPort } from '@modules/notifications/application/ports/notification-events.port';
import type {
	NotificationsReadAllEventResponse,
	NotificationUpdatedEventResponse,
} from '@modules/notifications/application/use-cases/notification-response';
import { Inject } from '@nestjs/common';
import {
	OnGatewayConnection,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@packages/auth/roles/role';
import { Server, Socket } from 'socket.io';

type NotificationSocket = Socket & {
	data: {
		user?: AuthenticatedUser;
	};
};

type NotificationErrorCode =
	| 'AUTHENTICATION_REQUIRED'
	| 'INVALID_ACCESS_TOKEN'
	| 'INSUFFICIENT_PERMISSIONS'
	| 'INTERNAL_ERROR';

@WebSocketGateway({
	namespace: 'notifications',
})
export class NotificationsGateway
	implements OnGatewayConnection<NotificationSocket>, NotificationEventsPort
{
	@WebSocketServer()
	private server?: Server;

	constructor(
		@Inject(ACCESS_TOKEN_SERVICE_KEY)
		private readonly accessTokenService: AccessTokenServicePort,
		private readonly webSessionCookieService: WebSessionCookieService,
	) {}

	handleConnection(client: NotificationSocket): void {
		try {
			const user = this.getAuthenticatedUser(client);
			if (
				user.role !== Role.CLIENT &&
				user.role !== Role.BOOSTER &&
				user.role !== Role.ADMIN
			)
				throw new InsufficientPermissionsError();

			client.data.user = user;
			void client.join(this.getUserRoom(user.id));
			void client.emit('notifications:connected', { userId: user.id });
		} catch (error) {
			this.emitError(client, error);
			client.disconnect(true);
		}
	}

	emitNotificationUpdated(
		recipientId: string,
		event: NotificationUpdatedEventResponse,
	): void {
		void this.server
			?.to(this.getUserRoom(recipientId))
			.emit('notifications:updated', event);
	}

	emitNotificationsReadAll(
		recipientId: string,
		event: NotificationsReadAllEventResponse,
	): void {
		void this.server
			?.to(this.getUserRoom(recipientId))
			.emit('notifications:read-all', event);
	}

	private getAuthenticatedUser(client: NotificationSocket): AuthenticatedUser {
		const token = this.getToken(client);
		if (token) return this.accessTokenService.verify(token);

		const user = this.webSessionCookieService.verifyCookieHeader(
			client.handshake.headers.cookie,
		);
		if (!user) throw new AuthenticationRequiredError();

		return user;
	}

	private getToken(client: NotificationSocket): string | null {
		const authToken = client.handshake.auth.token;
		if (typeof authToken === 'string' && authToken.trim())
			return this.normalizeToken(authToken);

		const authorization = client.handshake.headers.authorization;
		if (typeof authorization === 'string')
			return this.normalizeToken(authorization);

		return null;
	}

	private normalizeToken(value: string): string {
		if (value.startsWith('Bearer '))
			return value.slice('Bearer '.length).trim();
		if (value.trim()) return value.trim();
		throw new AuthenticationRequiredError();
	}

	private getUserRoom(userId: string): string {
		return `user:${userId}:notifications`;
	}

	private emitError(client: NotificationSocket, error: unknown): void {
		const code = this.getErrorCode(error);
		void client.emit('notifications:error', {
			code,
			message: this.getErrorMessage(code),
		});
	}

	private getErrorCode(error: unknown): NotificationErrorCode {
		if (error instanceof AuthenticationRequiredError)
			return 'AUTHENTICATION_REQUIRED';
		if (error instanceof InvalidAccessTokenError) return 'INVALID_ACCESS_TOKEN';
		if (error instanceof InsufficientPermissionsError)
			return 'INSUFFICIENT_PERMISSIONS';

		return 'INTERNAL_ERROR';
	}

	private getErrorMessage(code: NotificationErrorCode): string {
		const messages: Record<NotificationErrorCode, string> = {
			AUTHENTICATION_REQUIRED: 'Authentication required.',
			INVALID_ACCESS_TOKEN: 'Invalid access token.',
			INSUFFICIENT_PERMISSIONS: 'Insufficient permissions.',
			INTERNAL_ERROR: 'Unable to process notification event.',
		};

		return messages[code];
	}
}
