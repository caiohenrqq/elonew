export const EMAIL_SENDER_KEY = Symbol('EMAIL_SENDER_KEY');

export type SendEmailInput = {
	html: string;
	subject: string;
	text?: string;
	to: string;
};

export interface EmailSenderPort {
	send(input: SendEmailInput): Promise<void>;
}
