import {
	DEV_USER_PASSWORD,
	DEV_USERS,
	type DevUser,
} from '@packages/shared/testing/dev-users';
import { expect, type Page } from '@playwright/test';

export type AiDashboardInspectionRole = Lowercase<DevUser['role']>;

type AiDashboardInspectionAccount = {
	email: string;
	password: string;
	dashboardPath: string;
	portalLabel: RegExp;
};

const portalLabelByRole: Record<DevUser['role'], RegExp> = {
	ADMIN: /portal do admin/i,
	BOOSTER: /portal do booster/i,
	CLIENT: /portal do cliente/i,
};

export const aiDashboardInspectionAccounts = Object.fromEntries(
	DEV_USERS.map((user) => [
		user.role.toLowerCase(),
		{
			email: user.email,
			password: DEV_USER_PASSWORD,
			dashboardPath: user.dashboardPath,
			portalLabel: portalLabelByRole[user.role],
		},
	]),
) as Record<AiDashboardInspectionRole, AiDashboardInspectionAccount>;

export const aiDashboardInspectionRoles = Object.keys(
	aiDashboardInspectionAccounts,
) as AiDashboardInspectionRole[];

export const loginForAiDashboardInspection = async (
	page: Page,
	role: AiDashboardInspectionRole,
) => {
	const account = aiDashboardInspectionAccounts[role];

	await page.goto('/login');
	await page.getByLabel(/e-mail/i).fill(account.email);
	await page.getByLabel(/senha/i).fill(account.password);
	const submitButton = page.getByRole('button', { name: /entrar agora/i });
	await expect(submitButton).toBeEnabled();
	await submitButton.click();

	const throttleMessage = page.getByText(
		/ThrottlerException: Too Many Requests/i,
	);
	if (await throttleMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
		await page.waitForTimeout(61_000);
		await expect(submitButton).toBeEnabled();
		await submitButton.click();
	}

	await expect(page).toHaveURL(
		new RegExp(`${account.dashboardPath}(?:$|[/?#])`),
	);
	await expect(page.locator('body')).toContainText(account.portalLabel);
};
