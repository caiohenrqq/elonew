import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';
import { OrderSupportCard } from './order-support-card';

jest.mock('next/link', () => ({
	__esModule: true,
	default: ({
		children,
		href,
		...props
	}: PropsWithChildren<
		AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
	>) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

describe('OrderSupportCard', () => {
	it('links ticket creation to the current order', () => {
		render(<OrderSupportCard orderId="order 1" />);

		expect(screen.getByRole('link', { name: /abrir ticket/i })).toHaveAttribute(
			'href',
			'/client/tickets/new?orderId=order%201',
		);
	});
});
