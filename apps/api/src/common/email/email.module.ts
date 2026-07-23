import { Module } from '@nestjs/common';
import { ResendEmailSender } from './infrastructure/resend-email.sender';
import { EMAIL_SENDER_KEY } from './ports/email-sender.port';

@Module({
	providers: [
		ResendEmailSender,
		{
			provide: EMAIL_SENDER_KEY,
			useExisting: ResendEmailSender,
		},
	],
	exports: [EMAIL_SENDER_KEY],
})
export class EmailModule {}
