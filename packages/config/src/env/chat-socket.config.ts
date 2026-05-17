export const DEFAULT_CHAT_SOCKET_ALLOWED_ORIGINS = 'http://localhost:3001';

export function parseChatSocketAllowedOrigins(value: string): string[] {
	return value
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
}
