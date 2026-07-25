import {
	ORDER_QUOTES_CLEANUP_EXPIRED_INTERNAL_ROUTE,
	PAYMENTS_RECONCILE_STALE_CHECKOUTS_INTERNAL_ROUTE,
	type ScheduledTaskName,
} from '@packages/shared/scheduled-tasks/scheduled-tasks.contract';

export type ScheduledTask = {
	name: ScheduledTaskName;
	cron: string;
	route: string;
	body: Record<string, number>;
};

type ScheduledTaskSettings = {
	staleCheckoutReconcileCron: string;
	staleCheckoutReconcileLimit: number;
	orderQuoteCleanupCron: string;
	orderQuoteCleanupLimit: number;
};

// The declared inventory of recurring work. A queued job carries only the task
// name; the route is resolved from here at execution time, so a stale or
// tampered payload in Redis can never make the worker call an arbitrary
// internal endpoint.
export function buildScheduledTasks(
	settings: ScheduledTaskSettings,
): ScheduledTask[] {
	return [
		{
			name: 'reconcile_stale_checkouts',
			cron: settings.staleCheckoutReconcileCron,
			route: PAYMENTS_RECONCILE_STALE_CHECKOUTS_INTERNAL_ROUTE,
			body: { limit: settings.staleCheckoutReconcileLimit },
		},
		{
			name: 'cleanup_expired_order_quotes',
			cron: settings.orderQuoteCleanupCron,
			route: ORDER_QUOTES_CLEANUP_EXPIRED_INTERNAL_ROUTE,
			body: { limit: settings.orderQuoteCleanupLimit },
		},
	];
}
