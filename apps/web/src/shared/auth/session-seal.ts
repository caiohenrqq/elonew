import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from 'node:crypto';
import { z } from 'zod';

const sealedSessionPayloadSchema = z.object({
	accessToken: z.string().min(1),
	refreshToken: z.string().min(1),
	accessTokenExpiresAt: z.number().int().positive(),
	userRole: z.string().min(1),
	username: z.string().min(1).optional(),
});

export type SealedSessionPayload = z.infer<typeof sealedSessionPayloadSchema>;

const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

export const sealSessionPayload = (
	payload: SealedSessionPayload,
	secret: string,
) => {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(ALGORITHM, deriveKey(secret), iv);
	const ciphertext = Buffer.concat([
		cipher.update(JSON.stringify(payload), 'utf8'),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	return [
		VERSION,
		iv.toString('base64url'),
		authTag.toString('base64url'),
		ciphertext.toString('base64url'),
	].join('.');
};

export const unsealSessionPayload = (
	sealedPayload: string,
	secret: string,
): SealedSessionPayload | null => {
	try {
		const [version, iv, authTag, ciphertext] = sealedPayload.split('.');
		if (version !== VERSION || !iv || !authTag || !ciphertext) return null;

		const decipher = createDecipheriv(
			ALGORITHM,
			deriveKey(secret),
			Buffer.from(iv, 'base64url'),
		);
		decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

		const plaintext = Buffer.concat([
			decipher.update(Buffer.from(ciphertext, 'base64url')),
			decipher.final(),
		]).toString('utf8');

		return sealedSessionPayloadSchema.parse(JSON.parse(plaintext));
	} catch {
		return null;
	}
};

const deriveKey = (secret: string) => {
	if (secret.length < 32) {
		throw new Error('WEB_SESSION_SECRET must be at least 32 characters long.');
	}

	return createHash('sha256').update(secret).digest();
};
