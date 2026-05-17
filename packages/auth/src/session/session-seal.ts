import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from 'node:crypto';

export type SealedSessionPayload = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresAt: number;
	userId?: string;
	userRole: string;
	username?: string;
};

const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

export const sealSessionPayload = (
	payload: SealedSessionPayload,
	secret: string,
) => {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(ALGORITHM, deriveSessionKey(secret), iv);
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
		const [version, iv, authTag, ciphertext, ...rest] =
			sealedPayload.split('.');
		if (
			version !== VERSION ||
			!iv ||
			!authTag ||
			!ciphertext ||
			rest.length > 0
		)
			return null;

		const decipher = createDecipheriv(
			ALGORITHM,
			deriveSessionKey(secret),
			Buffer.from(iv, 'base64url'),
		);
		decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

		const plaintext = Buffer.concat([
			decipher.update(Buffer.from(ciphertext, 'base64url')),
			decipher.final(),
		]).toString('utf8');

		return parseSealedSessionPayload(JSON.parse(plaintext));
	} catch {
		return null;
	}
};

const parseSealedSessionPayload = (
	payload: unknown,
): SealedSessionPayload | null => {
	if (!payload || typeof payload !== 'object') return null;

	const candidate = payload as Partial<
		Record<keyof SealedSessionPayload, unknown>
	>;
	if (
		typeof candidate.accessToken !== 'string' ||
		!candidate.accessToken ||
		typeof candidate.refreshToken !== 'string' ||
		!candidate.refreshToken ||
		typeof candidate.accessTokenExpiresAt !== 'number' ||
		!Number.isSafeInteger(candidate.accessTokenExpiresAt) ||
		candidate.accessTokenExpiresAt <= 0 ||
		typeof candidate.userRole !== 'string' ||
		!candidate.userRole
	)
		return null;

	if (
		candidate.userId !== undefined &&
		(typeof candidate.userId !== 'string' || !candidate.userId)
	)
		return null;

	if (
		candidate.username !== undefined &&
		(typeof candidate.username !== 'string' || !candidate.username)
	)
		return null;

	return {
		accessToken: candidate.accessToken,
		refreshToken: candidate.refreshToken,
		accessTokenExpiresAt: candidate.accessTokenExpiresAt,
		userId: candidate.userId,
		userRole: candidate.userRole,
		username: candidate.username,
	};
};

const deriveSessionKey = (secret: string) => {
	if (secret.length < 32)
		throw new Error('WEB_SESSION_SECRET must be at least 32 characters long.');

	return createHash('sha256').update(secret).digest();
};
