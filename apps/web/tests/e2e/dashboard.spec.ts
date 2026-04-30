import { expect, test } from '@playwright/test';

test.describe('Dashboard UX & Security', () => {
	test('should redirect unauthenticated users from dashboard to login', async ({
		page,
	}) => {
		await page.goto('/client');
		await expect(page).toHaveURL(/\/login/);
	});

	test('should display login page message for protected route', async ({
		page,
	}) => {
		await page.goto('/client');
		await expect(page.locator('h1')).toContainText(/acesse/i);
	});
});
