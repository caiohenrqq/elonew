import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
	test('should render main sections on the landing page', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveTitle(/EloNew/);

		const startNow = page
			.locator('text=Começar subida')
			.or(page.locator('text=Abrir App'));
		await expect(startNow.first()).toBeVisible();
	});

	test('should navigate to login from hero CTA', async ({ page }) => {
		await page.goto('/');
		await page.click('text=Abrir App');
		await expect(page).toHaveURL(/\/login/);
	});
});
