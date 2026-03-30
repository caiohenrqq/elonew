import { OrderCredentialsCipherService } from '@modules/orders/infrastructure/security/order-credentials-cipher.service';
import { ORDER_CREDENTIALS_ENCRYPTION_KEY_ERROR_MESSAGE } from '@packages/config/env/order-credentials-encryption-key';

describe('OrderCredentialsCipherService', () => {
	const appSettings = {
		orderCredentialsEncryptionKey:
			'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
	};

	it('encrypts and decrypts credential fields', () => {
		const service = new OrderCredentialsCipherService(appSettings as never);
		const encryptedValue = service.encrypt('secret-db');

		expect(encryptedValue).not.toBe('secret-db');
		expect(encryptedValue.startsWith('v1:')).toBe(true);
		expect(service.decrypt(encryptedValue)).toBe('secret-db');
	});

	it('supports legacy plaintext reads during rollout', () => {
		const service = new OrderCredentialsCipherService(appSettings as never);

		expect(service.decrypt('legacy-plaintext')).toBe('legacy-plaintext');
	});

	it('rejects malformed encryption keys', () => {
		expect(
			() =>
				new OrderCredentialsCipherService({
					orderCredentialsEncryptionKey: 'not-valid-base64',
				} as never),
		).toThrow(ORDER_CREDENTIALS_ENCRYPTION_KEY_ERROR_MESSAGE);
	});
});
