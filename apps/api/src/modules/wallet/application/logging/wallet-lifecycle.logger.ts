import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

export type WalletLifecycleLogEvent = {
	event: 'wallet.lifecycle';
	operation:
		| 'credit_order_completion'
		| 'release_order_completion'
		| 'admin_force_release';
	outcome?: 'success' | 'error' | 'skipped';
	duration_ms?: number;
	booster_id?: string;
	order_id?: string;
	admin_user_id?: string;
	wallet_amount?: number;
	released_amount?: number;
	released_transaction_count?: number;
	balance_locked_before?: number;
	balance_locked_after?: number;
	balance_withdrawable_before?: number;
	balance_withdrawable_after?: number;
	available_at?: string;
	lock_period_hours?: number;
	release_source?: 'schedule' | 'admin';
	skipped_reason?:
		| 'credit_already_exists'
		| 'wallet_not_found'
		| 'credit_not_found'
		| 'already_released'
		| 'not_matured';
	side_effects?: string[];
	error_type?: string;
	error_message?: string;
};

export type WalletLifecycleLoggerPort = Pick<WalletLifecycleLogger, 'emit'>;

export function markWalletLifecycleLogError(
	event: WalletLifecycleLogEvent,
	error: unknown,
): void {
	event.outcome = 'error';
	event.error_type =
		error instanceof Error ? error.constructor.name : typeof error;
	event.error_message =
		error instanceof Error ? error.message : 'Unknown error';
}

@Injectable()
export class WalletLifecycleLogger {
	constructor(private readonly logger: PinoLogger) {
		this.logger.setContext(WalletLifecycleLogger.name);
	}

	emit(event: WalletLifecycleLogEvent, startedAt: number): void {
		event.duration_ms = Date.now() - startedAt;

		if (event.outcome === 'error') this.logger.error(event);
		else this.logger.info(event);
	}
}
