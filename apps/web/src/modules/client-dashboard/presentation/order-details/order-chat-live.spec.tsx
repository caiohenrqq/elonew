import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderChatPanel } from './order-chat-panel';

type Listener = (payload?: unknown) => void;

class SocketStub {
	readonly listeners = new Map<string, Listener>();
	readonly emitted: Array<[string, unknown]> = [];
	connected = true;

	on(event: string, listener: Listener) {
		this.listeners.set(event, listener);
		return this;
	}

	off(event: string) {
		this.listeners.delete(event);
		return this;
	}

	emit(event: string, payload: unknown) {
		this.emitted.push([event, payload]);
		return this;
	}

	close() {}

	trigger(event: string, payload?: unknown) {
		this.listeners.get(event)?.(payload);
	}
}

const socket = new SocketStub();
const refresh = jest.fn();

jest.mock('next/navigation', () => ({
	useRouter: () => ({ refresh }),
}));

jest.mock('socket.io-client', () => ({
	io: jest.fn(() => socket),
}));

describe('OrderChatPanel live updates', () => {
	beforeEach(() => {
		refresh.mockClear();
		socket.emitted.length = 0;
		socket.listeners.clear();
	});

	it('shows a message broadcast by the order chat socket without a refresh', () => {
		render(
			<OrderChatPanel
				currentUserId="client-1"
				initialMessages={[]}
				orderId="order-1"
				orderStatus="in_progress"
			/>,
		);

		act(() => {
			socket.trigger('chat:message.created', {
				id: 'message-1',
				orderId: 'order-1',
				chatId: 'chat-1',
				content: 'Mensagem ao vivo',
				sender: {
					id: 'booster-1',
					username: 'Booster',
					role: 'BOOSTER',
				},
				createdAt: '2026-08-04T01:25:43.000Z',
			});
		});

		expect(screen.getByText('Mensagem ao vivo')).toBeInTheDocument();
	});

	it('sends messages through the order chat socket', async () => {
		render(
			<OrderChatPanel
				currentUserId="client-1"
				initialMessages={[]}
				orderId="order-1"
				orderStatus="in_progress"
			/>,
		);

		await userEvent.type(
			screen.getByRole('textbox', { name: 'Mensagem do chat' }),
			'Olá booster',
		);
		await userEvent.click(
			screen.getByRole('button', { name: 'Enviar mensagem' }),
		);

		expect(socket.emitted).toContainEqual([
			'chat:send',
			{ orderId: 'order-1', content: 'Olá booster' },
		]);
	});

	it('refreshes missed history after reconnecting', () => {
		render(
			<OrderChatPanel
				currentUserId="client-1"
				initialMessages={[]}
				orderId="order-1"
				orderStatus="in_progress"
			/>,
		);

		act(() => socket.trigger('connect'));
		act(() => socket.trigger('connect'));

		expect(refresh).toHaveBeenCalledTimes(1);
	});
});
