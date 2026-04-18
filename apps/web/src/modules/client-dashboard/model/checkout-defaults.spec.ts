import { createInitialCheckoutInput } from './checkout-defaults';

describe('createInitialCheckoutInput', () => {
	it('sets the default deadline seven days from the provided time', () => {
		const input = createInitialCheckoutInput(
			new Date('2026-04-14T12:00:00.000Z'),
		);

		expect(input.deadline).toBe('2026-04-21T12:00:00.000Z');
	});
});
