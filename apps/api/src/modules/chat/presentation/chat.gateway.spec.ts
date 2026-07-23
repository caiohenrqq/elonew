import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import type { AuthenticateAccessTokenUseCase } from '@modules/auth/application/use-cases/authenticate-access-token/authenticate-access-token.use-case';
import {
	AuthUserBlockedError,
	InvalidAccessTokenError,
} from '@modules/auth/domain/auth.errors';
import type { WebSessionCookieService } from '@modules/auth/infrastructure/security/web-session-cookie.service';
import type { ChatMessageResponse } from '@modules/chat/application/use-cases/chat-response';
import type { ListChatMessagesUseCase } from '@modules/chat/application/use-cases/list-chat-messages/list-chat-messages.use-case';
import type { SendChatMessageUseCase } from '@modules/chat/application/use-cases/send-chat-message/send-chat-message.use-case';
import { ChatNotWritableError } from '@modules/chat/domain/chat.errors';
import { ChatGateway } from '@modules/chat/presentation/chat.gateway';
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

class ListChatMessagesUseCaseStub {
	readonly inputs: unknown[] = [];
	error: Error | null = null;

	async execute(input: unknown): Promise<{ items: []; nextCursor: null }> {
		this.inputs.push(input);
		if (this.error) throw this.error;
		return { items: [], nextCursor: null };
	}
}

class SendChatMessageUseCaseStub {
	readonly inputs: unknown[] = [];
	error: Error | null = null;

	async execute(input: {
		orderId: string;
		content: string;
	}): Promise<ChatMessageResponse> {
		this.inputs.push(input);
		if (this.error) throw this.error;
		return {
			id: 'message-1',
			orderId: input.orderId,
			chatId: 'chat-1',
			content: input.content,
			sender: {
				id: 'client-1',
				username: 'client',
				role: Role.CLIENT,
			},
			createdAt: '2026-05-10T12:00:00.000Z',
		};
	}
}

type EmittedEvent = {
	event: string;
	payload: unknown;
};

class ChatSocketStub {
	readonly data: Record<string, unknown> = {};
	readonly emitted: EmittedEvent[] = [];
	readonly joinedRooms: string[] = [];
	readonly leftRooms: string[] = [];
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

	async leave(room: string): Promise<void> {
		this.leftRooms.push(room);
	}

	disconnect(): void {
		this.disconnectCalled = true;
	}
}

const makeGateway = (
	user: AuthenticatedUser | Error = { id: 'client-1', role: Role.CLIENT },
	rejection: Error | null = null,
) => {
	const listUseCase = new ListChatMessagesUseCaseStub();
	const sendUseCase = new SendChatMessageUseCaseStub();
	const webSessionCookieService = new WebSessionCookieServiceStub();
	const emittedToRooms: Array<{
		room: string;
		event: string;
		payload: unknown;
	}> = [];
	const gateway = new ChatGateway(
		new AuthenticateAccessTokenStub(
			user,
			rejection,
		) as unknown as AuthenticateAccessTokenUseCase,
		webSessionCookieService as unknown as WebSessionCookieService,
		listUseCase as unknown as ListChatMessagesUseCase,
		sendUseCase as unknown as SendChatMessageUseCase,
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

	return {
		emittedToRooms,
		gateway,
		listUseCase,
		sendUseCase,
		webSessionCookieService,
	};
};

describe('ChatGateway', () => {
	it('authenticates connections with a bearer handshake token', async () => {
		const { gateway } = makeGateway();
		const socket = new ChatSocketStub();
		socket.handshake.auth.token = 'Bearer valid-token';

		await gateway.handleConnection(socket as never);

		expect(socket.data.user).toEqual({ id: 'client-1', role: Role.CLIENT });
		expect(socket.disconnectCalled).toBe(false);
	});

	it('disconnects a blocked user holding an unexpired token', async () => {
		const { gateway } = makeGateway(
			{ id: 'client-1', role: Role.CLIENT },
			new AuthUserBlockedError(),
		);
		const socket = new ChatSocketStub();
		socket.handshake.auth.token = 'Bearer still-valid-token';

		await gateway.handleConnection(socket as never);

		expect(socket.data.user).toBeUndefined();
		expect(socket.disconnectCalled).toBe(true);
	});

	it('disconnects invalid token connections', async () => {
		const { gateway } = makeGateway(new InvalidAccessTokenError());
		const socket = new ChatSocketStub();
		socket.handshake.auth.token = 'invalid-token';

		await gateway.handleConnection(socket as never);

		expect(socket.disconnectCalled).toBe(true);
		expect(socket.emitted).toContainEqual({
			event: 'chat:error',
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
		const socket = new ChatSocketStub();
		socket.handshake.headers.cookie = 'elonew.session=sealed-session';
		webSessionCookieService.user = { id: 'client-cookie', role: Role.CLIENT };

		await gateway.handleConnection(socket as never);

		expect(socket.data.user).toEqual({
			id: 'client-cookie',
			role: Role.CLIENT,
		});
		expect(socket.disconnectCalled).toBe(false);
	});

	it('joins authorized users to order chat rooms', async () => {
		const { gateway, listUseCase } = makeGateway();
		const socket = new ChatSocketStub();
		socket.data.user = { id: 'client-1', role: Role.CLIENT };

		await gateway.join({ orderId: 'order-1' }, socket as never);

		expect(listUseCase.inputs).toEqual([
			{
				orderId: 'order-1',
				userId: 'client-1',
				role: Role.CLIENT,
				limit: 1,
			},
		]);
		expect(socket.joinedRooms).toEqual(['order:order-1:chat']);
		expect(socket.emitted).toContainEqual({
			event: 'chat:joined',
			payload: { orderId: 'order-1' },
		});
	});

	it('persists socket messages through the send use-case and broadcasts them', async () => {
		const { emittedToRooms, gateway, sendUseCase } = makeGateway();
		const socket = new ChatSocketStub();
		socket.data.user = { id: 'client-1', role: Role.CLIENT };

		await gateway.sendMessage(
			{ orderId: 'order-1', content: '  Olá booster  ' },
			socket as never,
		);

		expect(sendUseCase.inputs).toEqual([
			{
				orderId: 'order-1',
				userId: 'client-1',
				role: Role.CLIENT,
				content: 'Olá booster',
			},
		]);
		expect(socket.joinedRooms).toEqual(['order:order-1:chat']);
		expect(emittedToRooms).toMatchObject([
			{
				room: 'order:order-1:chat',
				event: 'chat:message.created',
				payload: {
					id: 'message-1',
					content: 'Olá booster',
				},
			},
		]);
	});

	it('maps not-writable socket sends to chat errors', async () => {
		const { gateway, sendUseCase } = makeGateway();
		const socket = new ChatSocketStub();
		socket.data.user = { id: 'client-1', role: Role.CLIENT };
		sendUseCase.error = new ChatNotWritableError();

		await gateway.sendMessage(
			{ orderId: 'order-1', content: 'Depois' },
			socket as never,
		);

		expect(socket.emitted).toContainEqual({
			event: 'chat:error',
			payload: {
				code: 'NOT_WRITABLE',
				message: 'Chat is not writable for this order.',
			},
		});
	});
});
