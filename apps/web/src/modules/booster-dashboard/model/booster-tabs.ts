export const boosterDashboardTabs = [
	{
		value: 'queue',
		href: '/booster?tab=queue',
		label: 'Fila',
	},
	{
		value: 'work',
		href: '/booster?tab=work',
		label: 'Trabalho',
	},
] as const;

export type BoosterDashboardTab =
	(typeof boosterDashboardTabs)[number]['value'];

export const DEFAULT_BOOSTER_DASHBOARD_TAB: BoosterDashboardTab = 'queue';

const boosterDashboardTabValues = new Set<string>(
	boosterDashboardTabs.map((tab) => tab.value),
);

export const parseBoosterDashboardTab = (
	value: string | undefined,
): BoosterDashboardTab => {
	if (value && boosterDashboardTabValues.has(value)) {
		return value as BoosterDashboardTab;
	}

	return DEFAULT_BOOSTER_DASHBOARD_TAB;
};
