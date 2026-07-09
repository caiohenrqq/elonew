import { render, screen } from '@testing-library/react';
import { OrderChatPanel } from './order-chat-panel';

jest.mock('@/shared/chat/chat-panel', () => ({
	ChatPanel: ({
		isDisabled,
		isReadOnly,
		statusText,
	}: {
		isDisabled?: boolean;
		isReadOnly?: boolean;
		statusText?: string;
	}) => (
		<div
			data-disabled={isDisabled ? 'true' : 'false'}
			data-readonly={isReadOnly ? 'true' : 'false'}
			data-testid="chat-panel"
		>
			{statusText}
		</div>
	),
}));

jest.mock('../../actions/order-actions', () => ({
	sendOrderChatMessageAction: jest.fn(),
}));

const renderPanel = (orderStatus: string) =>
	render(
		<OrderChatPanel
			currentUserId="client-1"
			initialMessages={[]}
			orderId="order-1"
			orderStatus={orderStatus}
		/>,
	);

describe('OrderChatPanel', () => {
	it('keeps terminal order chat read-only', () => {
		renderPanel('completed');

		const panel = screen.getByTestId('chat-panel');
		expect(panel).toHaveAttribute('data-readonly', 'true');
		expect(panel).toHaveAttribute('data-disabled', 'true');
		expect(panel).toHaveTextContent('Somente leitura');
	});

	it('keeps pending order chat disabled but not read-only', () => {
		renderPanel('pending_booster');

		const panel = screen.getByTestId('chat-panel');
		expect(panel).toHaveAttribute('data-readonly', 'false');
		expect(panel).toHaveAttribute('data-disabled', 'true');
		expect(panel).toHaveTextContent('Aguardando aceite');
	});
});
