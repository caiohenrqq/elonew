import { expect, test } from '@playwright/test';
import {
	aiDashboardInspectionAccounts,
	aiDashboardInspectionRoles,
	loginForAiDashboardInspection,
} from './support/ai-dashboard-inspection-users';

test.describe('AI dashboard inspection', () => {
	test.describe.configure({ mode: 'serial' });

	for (const role of aiDashboardInspectionRoles) {
		test(`opens the ${role} dashboard with seeded inspection credentials`, async ({
			page,
		}) => {
			await loginForAiDashboardInspection(page, role);

			const account = aiDashboardInspectionAccounts[role];
			await expect(page).toHaveURL(
				new RegExp(`${account.dashboardPath}(?:$|[/?#])`),
			);

			await expect(page.locator('.dashboard-entrance')).toBeVisible();

			await page.screenshot({
				fullPage: true,
				path: `test-results/ai-dashboard-inspection/${role}.png`,
			});
		});
	}

	test('keeps the empty client orders table from showing an internal scrollbar', async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await loginForAiDashboardInspection(page, 'client');

		const tableScrollArea = page.getByTestId('client-orders-table-scroll-area');
		await expect(tableScrollArea).toBeVisible();
		const tableComponentScrollArea = tableScrollArea
			.locator('table')
			.locator('..');
		await expect(
			tableScrollArea.getByText(/nenhum pedido encontrado/i),
		).toBeVisible();

		await tableScrollArea.evaluate((element) => {
			element.scrollIntoView({ block: 'end', inline: 'nearest' });
		});
		await page.mouse.wheel(0, 900);

		await expect
			.poll(async () =>
				tableComponentScrollArea.evaluate((element) => ({
					clientHeight: element.clientHeight,
					hasVerticalOverflow: element.scrollHeight > element.clientHeight,
					isScrollable: element.scrollTop > 0,
					overflowY: window.getComputedStyle(element).overflowY,
					scrollHeight: element.scrollHeight,
					scrollTop: element.scrollTop,
				})),
			)
			.toEqual(
				expect.objectContaining({
					isScrollable: false,
					hasVerticalOverflow: false,
				}),
			);
	});
});
