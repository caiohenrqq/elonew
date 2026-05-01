import { expect, test } from '@playwright/test';

test.describe('Start Redirection Logic', () => {
	test('should redirect unauthenticated users to /register', async ({
		page,
	}) => {
		await page.goto('/start');
		await expect(page).toHaveURL(/\/register/);
	});

	test('Hero CTA should be visible on the landing page', async ({ page }) => {
		await page.goto('/');

		const heroButton = page.locator('text=Começar subida').first();
		await expect(heroButton).toBeVisible();
	});

	test('Hero CTA should navigate to /start and then /register if unauthenticated', async ({
		page,
	}) => {
		await page.goto('/');
		await page.locator('text=Começar subida').first().click();
		await expect(page).toHaveURL(/\/register/);
	});

	test('Service card should navigate to /start', async ({ page }) => {
		await page.goto('/');
		await page.locator('text=Configurar').first().click();
		await expect(page).toHaveURL(/\/register/);
	});

	test('Navbar "Abrir App" should navigate to /start', async ({ page }) => {
		await page.goto('/');
		await page.click('text=Abrir App');
		await expect(page).toHaveURL(/\/register/);
	});
});
