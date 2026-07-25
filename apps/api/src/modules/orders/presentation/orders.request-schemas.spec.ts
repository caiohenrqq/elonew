import { acceptOrderSchema } from './orders.request-schemas';

describe('acceptOrderSchema', () => {
	it('rejects a deadline before today without imposing a maximum', () => {
		expect(
			acceptOrderSchema.safeParse({ deadline: '2000-01-01T23:59:59.999Z' })
				.success,
		).toBe(false);
		expect(
			acceptOrderSchema.safeParse({ deadline: '2100-01-01T23:59:59.999Z' })
				.success,
		).toBe(true);
	});
});
