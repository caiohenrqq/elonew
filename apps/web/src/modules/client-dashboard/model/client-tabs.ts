export const clientDashboardTabs = [
	{
		value: 'overview',
		href: '/client?tab=overview',
		label: 'Visão geral',
	},
	{
		value: 'orders',
		href: '/client?tab=orders',
		label: 'Pedidos',
	},
	{
		value: 'tickets',
		href: '/client?tab=tickets',
		label: 'Tickets',
	},
] as const;

export type ClientDashboardTab = (typeof clientDashboardTabs)[number]['value'];

export const DEFAULT_CLIENT_DASHBOARD_TAB: ClientDashboardTab = 'overview';

const clientDashboardTabValues = new Set<string>(
	clientDashboardTabs.map((tab) => tab.value),
);

export const parseClientDashboardTab = (
	value: string | undefined,
): ClientDashboardTab => {
	if (value && clientDashboardTabValues.has(value)) {
		return value as ClientDashboardTab;
	}

	return DEFAULT_CLIENT_DASHBOARD_TAB;
};
