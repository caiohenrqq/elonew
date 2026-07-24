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
		['login', 'short'],
		['password', 'curta'],
		['confirmPassword', 'curta'],
	])('rejects a %s below the minimum length', (field, value) => {
		const result = saveOrderCredentialsSchema.safeParse({
			...validInput,
			[field]: value,
		});

		expect(result.success).toBe(false);
	});

	it('never echoes credential values in issue messages', () => {
		const result = saveOrderCredentialsSchema.safeParse({
			...validInput,
			login: 'short',
			confirmPassword: 'outra-senha',
		});
		const messages = JSON.stringify(result.error?.issues);

		expect(messages).not.toContain('short');
		expect(messages).not.toContain('senha-forte-1');
		expect(messages).not.toContain('outra-senha');
	});
});
