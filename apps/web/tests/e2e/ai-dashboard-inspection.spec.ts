import { expect, test } from '@playwright/test';
import {
	aiDashboardInspectionAccounts,
	aiDashboardInspectionRoles,
	loginForAiDashboardInspection,
} from './support/ai-dashboard-inspection-users';

test.describe('AI dashboard inspection', () => {
	for (const role of aiDashboardInspectionRoles) {
		test(`opens the ${role} dashboard with seeded inspection credentials`, async ({
			page,
		}) => {
			await loginForAiDashboardInspection(page, role);

			const account = aiDashboardInspectionAccounts[role];
			await expect(page).toHaveURL(
				new RegExp(`${account.dashboardPath}(?:$|[/?#])`),
			);
			await page.screenshot({
				fullPage: true,
				path: `test-results/ai-dashboard-inspection/${role}.png`,
			});
		});
	}
});
