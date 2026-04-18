import { render, screen } from '@testing-library/react';
import { StepIndicator } from './step-indicator';

describe('StepIndicator', () => {
	it('renders the step names next to the step numbers', () => {
		render(<StepIndicator step={2} />);

		expect(screen.getByText('Serviço')).toBeInTheDocument();
		expect(screen.getByText('Detalhes')).toBeInTheDocument();
		expect(screen.getByText('Revisão')).toBeInTheDocument();
	});
});
