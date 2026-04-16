import { act, render, screen, waitFor } from '@testing-library/react';
import { previewOrderQuoteAction } from '../../actions/order-actions';
import { NewOrderWizard } from './new-order-wizard';

jest.mock('../../actions/order-actions', () => ({
	previewOrderQuoteAction: jest.fn(),
	startCheckoutAction: jest.fn(),
}));

jest.mock('@packages/ui/animation/gsap', () => ({
	gsap: {
		to: jest.fn(),
	},
	useGSAP: jest.fn(),
}));

jest.mock('motion/react', () => ({
	AnimatePresence: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

jest.mock('./service-step', () => ({
	ServiceStep: () => <div>Service step</div>,
}));

jest.mock('./details-step', () => ({
	DetailsStep: () => <div>Details step</div>,
}));

jest.mock('./review-step', () => ({
	ReviewStep: () => <div>Review step</div>,
}));

jest.mock('./step-indicator', () => ({
	StepIndicator: () => <div>Step indicator</div>,
}));

jest.mock('./wizard-step-transition', () => ({
	WizardStepTransition: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

jest.mock('./checkout-summary', () => ({
	CheckoutSummary: ({
		isQuotePreviewPending,
		quotePreviewError,
	}: {
		isQuotePreviewPending?: boolean;
		quotePreviewError?: string | null;
	}) => (
		<div>
			<span>{isQuotePreviewPending ? 'Calculando' : 'Pronto'}</span>
			{quotePreviewError ? <p>{quotePreviewError}</p> : null}
		</div>
	),
}));

describe('NewOrderWizard', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('clears pending quote preview state when preview request fails', async () => {
		(previewOrderQuoteAction as jest.Mock).mockRejectedValue(
			new Error('Preview failed'),
		);

		render(<NewOrderWizard />);

		expect(screen.getByText('Calculando')).toBeInTheDocument();

		await act(async () => {
			jest.advanceTimersByTime(300);
		});

		await waitFor(() => {
			expect(screen.getByText('Pronto')).toBeInTheDocument();
		});
		expect(
			screen.getByText('Não foi possível calcular o pedido.'),
		).toBeInTheDocument();
	});
});
