import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import type { AccessTokenServicePort } from '@modules/auth/application/ports/token-service.port';
import { InvalidAccessTokenError } from '@modules/auth/domain/auth.errors';
import type { WebSessionCookieService } from '@modules/auth/infrastructure/security/web-session-cookie.service';
import type { ChatMessageResponse } from '@modules/chat/application/use-cases/chat-response';
import type { ListChatMessagesUseCase } from '@modules/chat/application/use-cases/list-chat-messages/list-chat-messages.use-case';
import type { SendChatMessageUseCase } from '@modules/chat/application/use-cases/send-chat-message/send-chat-message.use-case';
import { ChatNotWritableError } from '@modules/chat/domain/chat.errors';
import { ChatGateway } from '@modules/chat/presentation/chat.gateway';
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
		new AccessTokenVerifierStub(user),
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
	it('authenticates connections with a bearer handshake token', () => {
		const { gateway } = makeGateway();
		const socket = new ChatSocketStub();
		socket.handshake.auth.token = 'Bearer valid-token';

		gateway.handleConnection(socket as never);

		expect(socket.data.user).toEqual({ id: 'client-1', role: Role.CLIENT });
		expect(socket.disconnectCalled).toBe(false);
	});

	it('disconnects invalid token connections', () => {
		const { gateway } = makeGateway(new InvalidAccessTokenError());
		const socket = new ChatSocketStub();
		socket.handshake.auth.token = 'invalid-token';

		gateway.handleConnection(socket as never);

		expect(socket.disconnectCalled).toBe(true);
		expect(socket.emitted).toContainEqual({
			event: 'chat:error',
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
		const socket = new ChatSocketStub();
		socket.handshake.headers.cookie = 'elonew.session=sealed-session';
		webSessionCookieService.user = { id: 'client-cookie', role: Role.CLIENT };

		gateway.handleConnection(socket as never);

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
