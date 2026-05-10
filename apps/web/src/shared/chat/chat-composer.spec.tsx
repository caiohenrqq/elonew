import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatComposer } from './chat-composer';

describe('ChatComposer', () => {
	it('sends trimmed content and clears the textarea', async () => {
		const user = userEvent.setup();
		const onSend = jest.fn();

		render(<ChatComposer onSend={onSend} />);

		const textarea = screen.getByRole('textbox', {
			name: /mensagem do chat/i,
		});
		await user.type(textarea, '  olá booster  ');
		await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));

		expect(onSend).toHaveBeenCalledTimes(1);
		expect(onSend).toHaveBeenCalledWith('olá booster');
		expect(textarea).toHaveValue('');
	});

	it('does not send when disabled', async () => {
		const user = userEvent.setup();
		const onSend = jest.fn();

		render(<ChatComposer onSend={onSend} isDisabled />);

		expect(
			screen.getByRole('button', { name: /enviar mensagem/i }),
		).toBeDisabled();
		await user.type(
			screen.getByRole('textbox', { name: /mensagem do chat/i }),
			'mensagem',
		);

		expect(onSend).not.toHaveBeenCalled();
	});
});
