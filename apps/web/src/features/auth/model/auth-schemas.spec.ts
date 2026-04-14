import { registerFormSchema } from './auth-schemas';

describe('registerFormSchema', () => {
	it('requires the terms to be accepted', () => {
		const result = registerFormSchema.safeParse({
			username: 'summoner',
			email: 'summoner@example.com',
			password: 'strong-password',
			termsAccepted: false,
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			'Aceite os termos para continuar.',
		);
	});
});
