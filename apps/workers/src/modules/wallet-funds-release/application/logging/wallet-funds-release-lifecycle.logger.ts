import { WorkerLogger } from '@app/common/logging/worker-logger';
import { WalletFundsReleaseExecutionFailedError } from '@modules/wallet-funds-release/domain/wallet-funds-release.errors';
import { Inject, Injectable } from '@nestjs/common';

export type WalletFundsReleaseLifecycleLogEvent = {
	event: 'wallet_funds_release.lifecycle';
	operation: 'process_job';
	outcome?: 'success' | 'error';
	duration_ms?: number;
	job_id?: string;
	queue_name?: string;
	attempt?: number;
	booster_id?: string;
	order_id?: string;
	available_at?: string;
	api_status?: number;
	api_request_id?: string;
	release_outcome?: string;
	released_amount?: number;
	error_type?: string;
	error_message?: string;
};

export type WalletFundsReleaseLifecycleLoggerPort = Pick<
	WalletFundsReleaseLifecycleLogger,
	'emit'
>;

export function markWalletFundsReleaseLifecycleLogError(
	event: WalletFundsReleaseLifecycleLogEvent,
	error: unknown,
): void {
	event.outcome = 'error';
	event.error_type =
		error instanceof Error ? error.constructor.name : typeof error;
	event.error_message =
		error instanceof Error ? error.message : 'Unknown error';

	if (
		error instanceof WalletFundsReleaseExecutionFailedError &&
		error.apiStatus !== null
	)
		event.api_status = error.apiStatus;
}

@Injectable()
export class WalletFundsReleaseLifecycleLogger {
	constructor(
		@Inject(WorkerLogger)
		private readonly logger: WorkerLogger,
	) {}

	emit(event: WalletFundsReleaseLifecycleLogEvent, startedAt: number): void {
		event.duration_ms = Date.now() - startedAt;

		if (event.outcome === 'error') this.logger.error(event);
		else this.logger.info(event);
	}
}
