import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { Injectable } from '@nestjs/common';
import { decodeOrderCredentialsEncryptionKey } from '@packages/config/env/order-credentials-encryption-key';

const LEGACY_VALUE_VERSION = 'v1';
const ENCRYPTED_VALUE_VERSION = 'v2';
const INITIALIZATION_VECTOR_LENGTH = 12;

export type OrderCredentialField = 'login' | 'summonerName' | 'password';

@Injectable()
export class OrderCredentialsCipherService {
	private readonly key: Buffer;

	constructor(private readonly appSettings: AppSettingsService) {
		this.key = decodeOrderCredentialsEncryptionKey(
			this.appSettings.orderCredentialsEncryptionKey,
		);
	}

	encryptField(
		orderId: string,
		field: OrderCredentialField,
		value: string,
	): string {
		if (!orderId)
			throw new Error(
				'Cannot encrypt an order credential without an order id.',
			);
		if (!value)
			throw new Error('Cannot encrypt an empty order credential value.');

		const initializationVector = randomBytes(INITIALIZATION_VECTOR_LENGTH);
		const cipher = createCipheriv(
			'aes-256-gcm',
			this.key,
			initializationVector,
		);
		cipher.setAAD(this.additionalAuthenticatedData(orderId, field));
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

	decryptField(
		orderId: string,
		field: OrderCredentialField,
		value: string,
	): string {
		if (value.startsWith(`${ENCRYPTED_VALUE_VERSION}:`))
			return this.decryptSealed(
				value,
				this.additionalAuthenticatedData(orderId, field),
			);
		if (value.startsWith(`${LEGACY_VALUE_VERSION}:`))
			return this.decryptSealed(value, null);

		// ponytail: legacy plaintext passthrough; drop once pre-encryption rows age out
		return value;
	}

	private decryptSealed(
		value: string,
		additionalAuthenticatedData: Buffer | null,
	): string {
		const [, initializationVector, authenticationTag, ciphertext, ...rest] =
			value.split(':');
		if (
			!initializationVector ||
			!authenticationTag ||
			ciphertext === undefined ||
			rest.length > 0
		)
			throw new Error('Invalid encrypted order credentials payload.');

		const decipher = createDecipheriv(
			'aes-256-gcm',
			this.key,
			Buffer.from(initializationVector, 'base64url'),
		);
		if (additionalAuthenticatedData)
			decipher.setAAD(additionalAuthenticatedData);
		decipher.setAuthTag(Buffer.from(authenticationTag, 'base64url'));

		return Buffer.concat([
			decipher.update(Buffer.from(ciphertext, 'base64url')),
			decipher.final(),
		]).toString('utf8');
	}

	private additionalAuthenticatedData(
		orderId: string,
		field: OrderCredentialField,
	): Buffer {
		return Buffer.from(`order-credentials:${orderId}:${field}`, 'utf8');
	}
}
