import { fireEvent, render, screen } from '@testing-library/react';
import type { SaveOrderCredentialsActionState } from '../../actions/order-actions';
import { OrderCredentialsCard } from './order-credentials-card';

const renderCard = (
	action: (
		state: SaveOrderCredentialsActionState,
		formData: FormData,
	) => Promise<SaveOrderCredentialsActionState> = async () => ({}),
	summonerName = 'Invocador',
) =>
	render(<OrderCredentialsCard action={action} summonerName={summonerName} />);

const getPassword = () => screen.getByLabelText(/^Senha/);
const getConfirmation = () => screen.getByLabelText(/^Confirmar senha/);
const getSubmit = () => screen.getByRole('button', { name: /Enviar acesso/ });

describe('OrderCredentialsCard', () => {
	it('prefills the summoner name declared at checkout and keeps it editable', () => {
		renderCard(undefined, 'Invocaodr');

		const field = screen.getByLabelText(/Nome de invocador/);
		expect(field).toHaveValue('Invocaodr');

		fireEvent.change(field, { target: { value: 'Invocador' } });
		expect(field).toHaveValue('Invocador');
	});

	it('blocks submission while the passwords differ', () => {
		renderCard();

		fireEvent.change(getPassword(), { target: { value: 'senha-forte-1' } });
		fireEvent.change(getConfirmation(), { target: { value: 'senha-forte-2' } });
		fireEvent.blur(getConfirmation());

		expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
		expect(getSubmit()).toBeDisabled();
	});

	it('allows submission once the passwords match', () => {
		renderCard();

		fireEvent.change(getPassword(), { target: { value: 'senha-forte-1' } });
		fireEvent.change(getConfirmation(), { target: { value: 'senha-forte-1' } });

		expect(getSubmit()).toBeEnabled();
	});

	it('masks both password fields by default', () => {
		renderCard();

		expect(getPassword()).toHaveAttribute('type', 'password');
		expect(getConfirmation()).toHaveAttribute('type', 'password');
	});
});
