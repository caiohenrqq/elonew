import { saveOrderCredentialsSchema } from './order-contracts';

const validInput = {
	login: 'summoner-login',
	summonerName: 'Invocador',
	password: 'senha-forte-1',
	confirmPassword: 'senha-forte-1',
};

describe('saveOrderCredentialsSchema', () => {
	it('accepts matching credentials', () => {
		expect(saveOrderCredentialsSchema.parse(validInput)).toEqual(validInput);
	});

	it('rejects mismatched password confirmation', () => {
		const result = saveOrderCredentialsSchema.safeParse({
			...validInput,
			confirmPassword: 'senha-forte-2',
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('As senhas não coincidem.');
	});

	it.each([
		['login', ''],
		['summonerName', ''],
		['password', 'curta'],
		['confirmPassword', 'curta'],
	])('rejects an invalid %s', (field, value) => {
		const result = saveOrderCredentialsSchema.safeParse({
			...validInput,
			[field]: value,
		});

		expect(result.success).toBe(false);
	});

	it('accepts a short login, matching the API bound', () => {
		// Riot logins can be well under eight characters; the API accepts any
		// non-empty value and the web layer must not lock those users out.
		expect(
			saveOrderCredentialsSchema.safeParse({ ...validInput, login: 'abc' })
				.success,
		).toBe(true);
	});

	it('reports validation failures in Portuguese', () => {
		const result = saveOrderCredentialsSchema.safeParse({
			...validInput,
			password: 'curta',
			confirmPassword: 'curta',
		});

		expect(result.error?.issues[0]?.message).toBe(
			'A senha deve ter entre 8 e 128 caracteres.',
		);
	});

	it('never echoes credential values in issue messages', () => {
		const result = saveOrderCredentialsSchema.safeParse({
			...validInput,
			login: '',
			confirmPassword: 'outra-senha',
		});
		const messages = JSON.stringify(result.error?.issues);

		expect(messages).not.toContain('senha-forte-1');
		expect(messages).not.toContain('outra-senha');
	});
});
