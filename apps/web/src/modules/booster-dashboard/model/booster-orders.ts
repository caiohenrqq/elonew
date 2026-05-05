import type { BadgeProps } from '@packages/ui/components/badge';
import type {
	BoosterOrderOutput,
	BoosterQueueOutput,
	BoosterWalletTransactionOutput,
	BoosterWorkOutput,
} from '../server/booster-contracts';

export type BoosterOrderStatusVariant = NonNullable<BadgeProps['variant']>;

export type BoosterOrder = BoosterOrderOutput & {
	statusLabel: string;
	statusVariant: BoosterOrderStatusVariant;
};

export type BoosterQueue = Omit<BoosterQueueOutput, 'availableOrders'> & {
	availableOrders: BoosterOrder[];
};

export type BoosterWork = Omit<
	BoosterWorkOutput,
	'activeOrders' | 'recentCompletedOrders'
> & {
	activeOrders: BoosterOrder[];
	recentCompletedOrders: BoosterOrder[];
};

const orderStatusLabels: Record<string, string> = {
	pending_booster: 'Disponível',
	in_progress: 'Em execução',
	completed: 'Finalizado',
	cancelled: 'Cancelado',
};

const orderStatusVariants: Record<string, BoosterOrderStatusVariant> = {
	pending_booster: 'warning',
	in_progress: 'warning',
	completed: 'success',
	cancelled: 'error',
};

const mapBoosterOrder = (order: BoosterOrderOutput): BoosterOrder => ({
	...order,
	statusLabel: orderStatusLabels[order.status] ?? 'Status indisponível',
	statusVariant: orderStatusVariants[order.status] ?? 'default',
});

export const toBoosterQueue = (queue: BoosterQueueOutput): BoosterQueue => ({
	...queue,
	availableOrders: queue.availableOrders.map(mapBoosterOrder),
});

export const toBoosterWork = (work: BoosterWorkOutput): BoosterWork => ({
	...work,
	activeOrders: work.activeOrders.map(mapBoosterOrder),
	recentCompletedOrders: work.recentCompletedOrders.map(mapBoosterOrder),
});

export const formatCurrency = (value: number | null) => {
	if (value === null) return 'Não informado';

	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);
};

export const formatTitleCase = (value: string) =>
	value
		.split(/[_\s-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

export const formatOrderRoute = (order: BoosterOrder) => {
	if (
		!order.currentLeague ||
		!order.currentDivision ||
		!order.desiredLeague ||
		!order.desiredDivision
	)
		return 'Rota indisponível';

	return `${formatTitleCase(order.currentLeague)} ${order.currentDivision} -> ${formatTitleCase(order.desiredLeague)} ${order.desiredDivision}`;
};

export const formatDate = (value: string | null) => {
	if (!value) return 'Não informado';

	return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
		new Date(value),
	);
};

export const formatTransactionReason = (
	reason: BoosterWalletTransactionOutput['reason'],
) => {
	if (reason === 'order_completion') return 'Conclusão de pedido';
	return 'Solicitação de saque';
};
