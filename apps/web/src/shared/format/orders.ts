import { formatTitleCase } from './text';

type RouteOrder = {
	currentLeague: string | null;
	currentDivision: string | null;
	desiredLeague: string | null;
	desiredDivision: string | null;
};

export const formatServiceType = (serviceType: string | null) =>
	serviceType ? formatTitleCase(serviceType) : 'Serviço indisponível';

export const formatOrderRoute = (order: RouteOrder) => {
	if (
		!order.currentLeague ||
		!order.currentDivision ||
		!order.desiredLeague ||
		!order.desiredDivision
	)
		return 'Rota indisponível';

	return `${formatTitleCase(order.currentLeague)} ${order.currentDivision} → ${formatTitleCase(order.desiredLeague)} ${order.desiredDivision}`;
};

const governanceActionLabels: Record<string, string> = {
	block_user: 'Bloqueio de usuário',
	force_cancel_order: 'Cancelamento forçado',
	unblock_user: 'Desbloqueio de usuário',
};

export const formatGovernanceAction = (type: string) =>
	governanceActionLabels[type] ?? formatTitleCase(type);
