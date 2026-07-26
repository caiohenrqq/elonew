import { createCipheriv } from 'node:crypto';
import { OrderCredentialsCipherService } from '@modules/orders/infrastructure/security/order-credentials-cipher.service';
import {
	decodeOrderCredentialsEncryptionKey,
	ORDER_CREDENTIALS_ENCRYPTION_KEY_ERROR_MESSAGE,
} from '@packages/config/env/order-credentials-encryption-key';

describe('OrderCredentialsCipherService', () => {
	const appSettings = {
		orderCredentialsEncryptionKey:
			'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
	};

	it('encrypts and decrypts credential fields', () => {
		const service = new OrderCredentialsCipherService(appSettings as never);
		const encryptedValue = service.encryptField(
			'order-1',
			'password',
			'secret-db',
		);

		expect(encryptedValue).not.toBe('secret-db');
		expect(encryptedValue.startsWith('v2:')).toBe(true);
		expect(service.decryptField('order-1', 'password', encryptedValue)).toBe(
			'secret-db',
		);
	});

	it('rejects encrypting empty values and empty order ids', () => {
		const service = new OrderCredentialsCipherService(appSettings as never);

		expect(() => service.encryptField('order-1', 'password', '')).toThrow(
			'Cannot encrypt an empty order credential value.',
		);
		expect(() => service.encryptField('', 'password', 'secret')).toThrow(
			'Cannot encrypt an order credential without an order id.',
		);
	});

	it('rejects malformed sealed payloads', () => {
		const service = new OrderCredentialsCipherService(appSettings as never);
		const encryptedValue = service.encryptField(
			'order-1',
			'password',
			'secret-db',
		);
		const [, iv, tag, ciphertext] = encryptedValue.split(':');

		for (const malformed of [
			`v2:${iv}:${tag}`,
			`v2:${iv}:${tag}:${ciphertext}:extra`,
			'v2:',
			`v2::${tag}:${ciphertext}`,
			`v2:${iv}::${ciphertext}`,
		])
			expect(() =>
				service.decryptField('order-1', 'password', malformed),
			).toThrow('Invalid encrypted order credentials payload.');
	});

	it('rejects ciphertext moved to another order or field', () => {
		const service = new OrderCredentialsCipherService(appSettings as never);
		const encryptedValue = service.encryptField(
			'order-1',
			'password',
			'secret-db',
		);

		expect(() =>
			service.decryptField('order-2', 'password', encryptedValue),
		).toThrow();
		expect(() =>
			service.decryptField('order-1', 'login', encryptedValue),
		).toThrow();
	});

	it('rejects tampered ciphertext', () => {
		const service = new OrderCredentialsCipherService(appSettings as never);
		const encryptedValue = service.encryptField(
			'order-1',
			'password',
			'secret-db',
		);
		const [version, iv, tag, ciphertext] = encryptedValue.split(':');
		const corrupted = Buffer.from(ciphertext, 'base64url');
		corrupted[0] ^= 0xff;
		const tampered = [version, iv, tag, corrupted.toString('base64url')].join(
			':',
		);

		expect(() =>
			service.decryptField('order-1', 'password', tampered),
		).toThrow();
	});

	// v1 carried no AAD, so accepting it would keep letting ciphertext be moved
	// between rows and fields undetected.
	it('rejects legacy v1 values', () => {
		const service = new OrderCredentialsCipherService(appSettings as never);
		const key = decodeOrderCredentialsEncryptionKey(
			appSettings.orderCredentialsEncryptionKey,
		);
		const iv = Buffer.alloc(12, 1);
		const cipher = createCipheriv('aes-256-gcm', key, iv);
		const ciphertext = Buffer.concat([
			cipher.update('legacy-secret', 'utf8'),
			cipher.final(),
		]);
		const legacyValue = [
			'v1',
			iv.toString('base64url'),
			cipher.getAuthTag().toString('base64url'),
			ciphertext.toString('base64url'),
		].join(':');

		expect(() =>
			service.decryptField('order-1', 'password', legacyValue),
		).toThrow('Invalid encrypted order credentials payload.');
	});

	it('rejects unsealed values instead of passing them through', () => {
		const service = new OrderCredentialsCipherService(appSettings as never);

		for (const unsealed of ['legacy-plaintext', '', 'v3:a:b:c'])
			expect(() => service.decryptField('order-1', 'login', unsealed)).toThrow(
				'Invalid encrypted order credentials payload.',
			);
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
