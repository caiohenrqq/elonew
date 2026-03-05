export const PROCESSED_WEBHOOK_EVENT_PORT_KEY = Symbol(
	'PROCESSED_WEBHOOK_EVENT_PORT_KEY',
);

export interface ProcessedWebhookEventPort {
	has(eventId: string): Promise<boolean>;
	markProcessed(eventId: string): Promise<void>;
}
