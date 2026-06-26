import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

export type AdminUserLifecycleLogEvent = {
	event: 'admin_user.lifecycle';
	operation: 'create' | 'resend_password_setup';
	outcome?: 'success' | 'error' | 'skipped';
	duration_ms?: number;
	admin_user_id?: string;
	target_user_id?: string;
	target_user_role?: string;
	target_user_status_before?: string;
	target_user_status_after?: string;
	email_sent?: boolean;
	side_effects?: string[];
	error_type?: string;
	error_message?: string;
};

export function markAdminUserLifecycleLogError(
	event: AdminUserLifecycleLogEvent,
	error: unknown,
): void {
	event.outcome = 'error';
	event.error_type =
		error instanceof Error ? error.constructor.name : typeof error;
	event.error_message =
		error instanceof Error ? error.message : 'Unknown error';
}

@Injectable()
export class AdminUserLifecycleLogger {
	constructor(private readonly logger: PinoLogger) {
		this.logger.setContext(AdminUserLifecycleLogger.name);
	}

	emit(event: AdminUserLifecycleLogEvent, startedAt: number): void {
		event.duration_ms = Date.now() - startedAt;

		if (event.outcome === 'error') this.logger.error(event);
		else this.logger.info(event);
	}
}
