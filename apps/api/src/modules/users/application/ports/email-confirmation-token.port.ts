export type GeneratedEmailConfirmationToken = {
	rawToken: string;
	tokenHash: string;
	expiresAt: Date;
};

export const EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY = Symbol(
	'EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY',
);

export interface EmailConfirmationTokenServicePort {
	generate(): GeneratedEmailConfirmationToken;
	hash(rawToken: string): string;
}
