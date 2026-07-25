export const PAYMENTS_RECONCILE_STALE_CHECKOUTS_INTERNAL_ROUTE =
	'/payments/internal/reconcile-stale-checkouts';

export const ORDER_QUOTES_CLEANUP_EXPIRED_INTERNAL_ROUTE =
	'/orders/internal/quotes/cleanup-expired';

export const SCHEDULED_TASK_NAMES = [
	'reconcile_stale_checkouts',
	'cleanup_expired_order_quotes',
] as const;

export type ScheduledTaskName = (typeof SCHEDULED_TASK_NAMES)[number];
