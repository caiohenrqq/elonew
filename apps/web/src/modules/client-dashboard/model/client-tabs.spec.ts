import {
	clientDashboardTabs,
	DEFAULT_CLIENT_DASHBOARD_TAB,
	parseClientDashboardTab,
} from './client-tabs';

describe('client dashboard tabs', () => {
	it('falls back to the overview tab when input is empty or unknown', () => {
		expect(parseClientDashboardTab(undefined)).toBe(
			DEFAULT_CLIENT_DASHBOARD_TAB,
		);
		expect(parseClientDashboardTab('unknown')).toBe(
			DEFAULT_CLIENT_DASHBOARD_TAB,
		);
	});

	it('parses known tabs and keeps hrefs URL-backed', () => {
		expect(parseClientDashboardTab('orders')).toBe('orders');
		expect(clientDashboardTabs).toEqual([
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
		]);
	});
});
