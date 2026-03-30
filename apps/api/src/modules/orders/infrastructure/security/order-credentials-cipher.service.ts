import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { Injectable } from '@nestjs/common';
import { decodeOrderCredentialsEncryptionKey } from '@packages/config/env/order-credentials-encryption-key';

const ENCRYPTED_VALUE_VERSION = 'v1';
const INITIALIZATION_VECTOR_LENGTH = 12;

@Injectable()
export class OrderCredentialsCipherService {
	private readonly key: Buffer;

	constructor(private readonly appSettings: AppSettingsService) {
		this.key = decodeOrderCredentialsEncryptionKey(
			this.appSettings.orderCredentialsEncryptionKey,
		);
	}

	encrypt(value: string): string {
		const initializationVector = randomBytes(INITIALIZATION_VECTOR_LENGTH);
		const cipher = createCipheriv(
			'aes-256-gcm',
			this.key,
			initializationVector,
		);
		const ciphertext = Buffer.concat([
			cipher.update(value, 'utf8'),
			cipher.final(),
		]);
		const authenticationTag = cipher.getAuthTag();

		return [
			ENCRYPTED_VALUE_VERSION,
			initializationVector.toString('base64url'),
			authenticationTag.toString('base64url'),
			ciphertext.toString('base64url'),
		].join(':');
	}

	decrypt(value: string): string {
		if (!value.startsWith(`${ENCRYPTED_VALUE_VERSION}:`)) return value;

		const [
			version,
			initializationVector,
			authenticationTag,
			ciphertext,
			...rest
		] = value.split(':');
		if (
			version !== ENCRYPTED_VALUE_VERSION ||
			!initializationVector ||
			!authenticationTag ||
			!ciphertext ||
			rest.length > 0
		)
			throw new Error('Invalid encrypted order credentials payload.');

		const decipher = createDecipheriv(
			'aes-256-gcm',
			this.key,
			Buffer.from(initializationVector, 'base64url'),
		);
		decipher.setAuthTag(Buffer.from(authenticationTag, 'base64url'));

		return Buffer.concat([
			decipher.update(Buffer.from(ciphertext, 'base64url')),
			decipher.final(),
		]).toString('utf8');
	}
}
