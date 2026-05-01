import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
	test('should redirect unauthenticated users from /client to /login', async ({
		page,
	}) => {
		await page.goto('/client');
		await expect(page).toHaveURL(/\/login/);
	});

	test('should show validation errors on login form', async ({ page }) => {
		await page.goto('/login');
		await page.click('button[type="submit"]');

		await expect(page.locator('form')).toContainText(/e-mail/i);
		await expect(page.locator('form')).toContainText(/senha/i);
	});

	test('should show validation errors on register form', async ({ page }) => {
		await page.goto('/register');
		await page.click('button[type="submit"]');

		await expect(page.locator('form')).toContainText(/usuário/i);
		await expect(page.locator('form')).toContainText(/e-mail/i);
		await expect(page.locator('form')).toContainText(/senha/i);
		await expect(page.locator('form')).toContainText(/termos/i);
	});

	test('should navigate between login and register', async ({ page }) => {
		await page.goto('/login');
		await page.click('text=Criar uma Nova Conta');
		await expect(page).toHaveURL(/\/register/);

		await page.click('text=Acessar Minha Conta');
		await expect(page).toHaveURL(/\/login/);
	});
});
