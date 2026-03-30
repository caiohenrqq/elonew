import { z } from 'zod';

const REQUIRED_KEY_LENGTH = 32;

export const ORDER_CREDENTIALS_ENCRYPTION_KEY_ERROR_MESSAGE =
	'ORDER_CREDENTIALS_ENCRYPTION_KEY must decode to exactly 32 bytes.';

export function decodeOrderCredentialsEncryptionKey(
	encodedKey: string,
): Buffer {
	const normalized = normalizeBase64(encodedKey);
	const decoded = Buffer.from(normalized, 'base64');
	if (decoded.length !== REQUIRED_KEY_LENGTH)
		throw new Error(ORDER_CREDENTIALS_ENCRYPTION_KEY_ERROR_MESSAGE);

	return decoded;
}

export const orderCredentialsEncryptionKeySchema = z
	.string()
	.trim()
	.min(1)
	.superRefine((value, context) => {
		try {
			decodeOrderCredentialsEncryptionKey(value);
		} catch (error) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					error instanceof Error
						? error.message
						: ORDER_CREDENTIALS_ENCRYPTION_KEY_ERROR_MESSAGE,
			});
		}
	});

function normalizeBase64(value: string): string {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const paddingLength = (4 - (normalized.length % 4)) % 4;

	return `${normalized}${'='.repeat(paddingLength)}`;
}
