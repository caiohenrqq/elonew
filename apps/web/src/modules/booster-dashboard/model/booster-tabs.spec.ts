import {
	DEFAULT_BOOSTER_DASHBOARD_TAB,
	parseBoosterDashboardTab,
} from './booster-tabs';

describe('booster dashboard tabs', () => {
	it('parses supported tabs and falls back to queue for invalid input', () => {
		expect(parseBoosterDashboardTab('queue')).toBe('queue');
		expect(parseBoosterDashboardTab('work')).toBe('work');
		expect(parseBoosterDashboardTab('unknown')).toBe(
			DEFAULT_BOOSTER_DASHBOARD_TAB,
		);
		expect(parseBoosterDashboardTab(undefined)).toBe(
			DEFAULT_BOOSTER_DASHBOARD_TAB,
		);
	});
});
