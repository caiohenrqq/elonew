import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { OrderDetailsHeader } from './order-details-header';

jest.mock('next/link', () => ({
	__esModule: true,
	default: ({
		children,
		href,
		...props
	}: PropsWithChildren<{ href: string }>) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

jest.mock('../../actions/order-actions', () => ({
	resumePaymentCheckoutAction: jest.fn(),
}));

const makeOrder = (status: string) => ({
	id: 'order-1',
	status,
	statusLabel: status,
	statusVariant: 'warning' as const,
	subtotal: 100,
	totalAmount: 100,
	discountAmount: 0,
});

describe('OrderDetailsHeader', () => {
	it('shows resume payment for orders awaiting payment', () => {
		render(<OrderDetailsHeader order={makeOrder('awaiting_payment')} />);

		expect(
			screen.getByRole('button', { name: /retomar pagamento/i }),
		).toBeInTheDocument();
	});

	it('hides resume payment after checkout is no longer pending', () => {
		render(<OrderDetailsHeader order={makeOrder('pending_booster')} />);

		expect(
			screen.queryByRole('button', { name: /retomar pagamento/i }),
		).not.toBeInTheDocument();
	});
});
