import { fireEvent, render, screen } from '@testing-library/react';
import { createInitialCheckoutInput } from '../../model/checkout-defaults';
import { DetailsStep } from './details-step';

jest.mock('@packages/ui/components/select', () => ({
	Select: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SelectContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SelectItem: ({
		children,
		value,
	}: {
		children: React.ReactNode;
		value: string;
	}) => <div data-value={value}>{children}</div>,
	SelectTrigger: ({
		children,
		id,
	}: {
		children: React.ReactNode;
		id?: string;
	}) => (
		<button id={id} type="button">
			{children}
		</button>
	),
	SelectValue: ({ placeholder }: { placeholder?: string }) => (
		<span>{placeholder}</span>
	),
}));

describe('DetailsStep', () => {
	it('reveals a UI-only favorite booster name input when selected', () => {
		const onToggleExtra = jest.fn();

		const { rerender } = render(
			<DetailsStep
				orderInput={createInitialCheckoutInput()}
				onBack={jest.fn()}
				onNext={jest.fn()}
				onChange={jest.fn()}
				onToggleExtra={onToggleExtra}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: /Booster Favorito/i }));
		expect(onToggleExtra).toHaveBeenCalledWith('favorite_booster');

		rerender(
			<DetailsStep
				orderInput={{
					...createInitialCheckoutInput(),
					extras: ['favorite_booster'],
				}}
				onBack={jest.fn()}
				onNext={jest.fn()}
				onChange={jest.fn()}
				onToggleExtra={onToggleExtra}
			/>,
		);

		expect(
			screen.getByLabelText(/Nome do Booster Favorito/i),
		).toBeInTheDocument();
		expect(screen.getByText(/0\/50/i)).toBeInTheDocument();
	});
});
