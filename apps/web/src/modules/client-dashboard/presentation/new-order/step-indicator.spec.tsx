import { render, screen } from '@testing-library/react';
import { StepIndicator } from './step-indicator';

describe('StepIndicator', () => {
	it('renders the step names next to the step numbers', () => {
		render(<StepIndicator step={2} />);

		expect(
			screen.getByRole('listitem', { name: 'Etapa 1: Serviço' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('listitem', { name: 'Etapa 2: Detalhes' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('listitem', { name: 'Etapa 4: Revisão' }),
		).toBeInTheDocument();
	});
});
