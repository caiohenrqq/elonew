import type { BadgeProps } from '@packages/ui/components/badge';
import type { GetOrderOutput } from '../server/order-contracts';

export type OrderStatusVariant = NonNullable<BadgeProps['variant']>;

export type ClientOrder = GetOrderOutput & {
	statusLabel: string;
	statusVariant: OrderStatusVariant;
};

const orderStatusLabels: Record<string, string> = {
	awaiting_payment: 'Aguardando Pagamento',
	pending_booster: 'Esperando Booster',
	in_progress: 'Em Progresso',
	completed: 'Concluído',
	cancelled: 'Cancelado',
};

const orderStatusVariants: Record<string, OrderStatusVariant> = {
	awaiting_payment: 'warning',
	pending_booster: 'warning',
	in_progress: 'warning',
	completed: 'success',
	cancelled: 'error',
};

export const toClientOrder = (order: GetOrderOutput): ClientOrder => ({
	...order,
	statusLabel: orderStatusLabels[order.status] ?? 'Status indisponível',
	statusVariant: orderStatusVariants[order.status] ?? 'default',
});

export const formatCurrency = (value: number | null) => {
	if (value === null) return 'Não informado';

	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);
};
