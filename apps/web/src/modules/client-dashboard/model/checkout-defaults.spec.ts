import { createInitialCheckoutInput } from './checkout-defaults';

describe('createInitialCheckoutInput', () => {
	it('does not calculate a deadline for the client', () => {
		const input = createInitialCheckoutInput(
			new Date('2026-04-14T12:00:00.000Z'),
		);

		expect(input).not.toHaveProperty('deadline');
	});
});
