import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { AuthenticateAccessTokenUseCase } from '@modules/auth/application/use-cases/authenticate-access-token/authenticate-access-token.use-case';
import {
	AuthenticationRequiredError,
	InsufficientPermissionsError,
	InvalidAccessTokenError,
} from '@modules/auth/domain/auth.errors';
import { WebSessionCookieService } from '@modules/auth/infrastructure/security/web-session-cookie.service';
import { ListChatMessagesUseCase } from '@modules/chat/application/use-cases/list-chat-messages/list-chat-messages.use-case';
import { SendChatMessageUseCase } from '@modules/chat/application/use-cases/send-chat-message/send-chat-message.use-case';
import {
	ChatForbiddenError,
	ChatMessageNotFoundError,
	ChatNotWritableError,
	ChatOrderNotFoundError,
} from '@modules/chat/domain/chat.errors';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@packages/auth/roles/role';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { sendChatMessageSchema } from './chat.request-schemas';

const chatOrderEventSchema = z.object({
	orderId: z.string().trim().min(1),
});

const socketSendChatMessageSchema = chatOrderEventSchema.extend({
	content: sendChatMessageSchema.shape.content,
});

type ChatSocket = Socket & {
	data: {
		user?: AuthenticatedUser;
	};
};

type ChatErrorCode =
	| 'AUTHENTICATION_REQUIRED'
	| 'INVALID_ACCESS_TOKEN'
	| 'INSUFFICIENT_PERMISSIONS'
	| 'NOT_FOUND'
	| 'NOT_WRITABLE'
	| 'VALIDATION_ERROR'
	| 'INTERNAL_ERROR';

@WebSocketGateway({
	namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection<ChatSocket> {
	@WebSocketServer()
	private server?: Server;

	constructor(
		private readonly authenticateAccessToken: AuthenticateAccessTokenUseCase,
		private readonly webSessionCookieService: WebSessionCookieService,
		private readonly listChatMessagesUseCase: ListChatMessagesUseCase,
		private readonly sendChatMessageUseCase: SendChatMessageUseCase,
	) {}

	async handleConnection(client: ChatSocket): Promise<void> {
		try {
			const user = await this.getAuthenticatedUser(client);
			if (user.role !== Role.CLIENT && user.role !== Role.BOOSTER)
				throw new InsufficientPermissionsError();

			client.data.user = user;
		} catch (error) {
			this.emitError(client, error);
			client.disconnect(true);
		}
	}

	private async getAuthenticatedUser(
		client: ChatSocket,
	): Promise<AuthenticatedUser> {
		const token = this.getToken(client);
		if (token) return await this.authenticateAccessToken.execute(token);

		const user = this.webSessionCookieService.verifyCookieHeader(
			client.handshake.headers.cookie,
		);
		if (!user) throw new AuthenticationRequiredError();

		return await this.authenticateAccessToken.ensureUsable(user.id);
	}

	@SubscribeMessage('chat:join')
	async join(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: ChatSocket,
	): Promise<void> {
		const user = this.requireUser(client);

		try {
			const input = chatOrderEventSchema.parse(payload);
			await this.listChatMessagesUseCase.execute({
				orderId: input.orderId,
				userId: user.id,
				role: user.role,
				limit: 1,
			});

			await client.join(this.getRoomName(input.orderId));
			void client.emit('chat:joined', { orderId: input.orderId });
		} catch (error) {
			this.emitError(client, error);
		}
	}

	@SubscribeMessage('chat:leave')
	async leave(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: ChatSocket,
	): Promise<void> {
		try {
			const input = chatOrderEventSchema.parse(payload);
			await client.leave(this.getRoomName(input.orderId));
			void client.emit('chat:left', { orderId: input.orderId });
		} catch (error) {
			this.emitError(client, error);
		}
	}

	@SubscribeMessage('chat:send')
	async sendMessage(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: ChatSocket,
	): Promise<void> {
		const user = this.requireUser(client);

		try {
			const input = socketSendChatMessageSchema.parse(payload);
			const message = await this.sendChatMessageUseCase.execute({
				orderId: input.orderId,
				userId: user.id,
				role: user.role,
				content: input.content,
			});
			const roomName = this.getRoomName(input.orderId);

			await client.join(roomName);
			void this.server?.to(roomName).emit('chat:message.created', message);
		} catch (error) {
			this.emitError(client, error);
		}
	}

	private requireUser(client: ChatSocket): AuthenticatedUser {
		const user = client.data.user;
		if (!user) throw new AuthenticationRequiredError();
		return user;
	}

	private getToken(client: ChatSocket): string | null {
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

	private getRoomName(orderId: string): string {
		return `order:${orderId}:chat`;
	}

	private emitError(client: ChatSocket, error: unknown): void {
		const code = this.getErrorCode(error);
		void client.emit('chat:error', {
			code,
			message: this.getErrorMessage(code),
		});
	}

	private getErrorCode(error: unknown): ChatErrorCode {
		if (error instanceof AuthenticationRequiredError)
			return 'AUTHENTICATION_REQUIRED';
		if (error instanceof InvalidAccessTokenError) return 'INVALID_ACCESS_TOKEN';
		if (
			error instanceof InsufficientPermissionsError ||
			error instanceof ChatForbiddenError
		)
			return 'INSUFFICIENT_PERMISSIONS';
		if (
			error instanceof ChatOrderNotFoundError ||
			error instanceof ChatMessageNotFoundError
		)
			return 'NOT_FOUND';
		if (error instanceof ChatNotWritableError) return 'NOT_WRITABLE';
		if (error instanceof z.ZodError) return 'VALIDATION_ERROR';

		return 'INTERNAL_ERROR';
	}

	private getErrorMessage(code: ChatErrorCode): string {
		const messages: Record<ChatErrorCode, string> = {
			AUTHENTICATION_REQUIRED: 'Authentication required.',
			INVALID_ACCESS_TOKEN: 'Invalid access token.',
			INSUFFICIENT_PERMISSIONS: 'Insufficient permissions.',
			NOT_FOUND: 'Chat order not found.',
			NOT_WRITABLE: 'Chat is not writable for this order.',
			VALIDATION_ERROR: 'Invalid chat payload.',
			INTERNAL_ERROR: 'Unable to process chat event.',
		};

		return messages[code];
	}
}
