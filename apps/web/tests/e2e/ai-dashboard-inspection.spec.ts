import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from '@playwright/test';
import {
	aiDashboardInspectionAccounts,
	aiDashboardInspectionRoles,
	loginForAiDashboardInspection,
} from './support/ai-dashboard-inspection-users';

const apiBaseUrl =
	process.env.PLAYWRIGHT_API_URL ??
	process.env.NEXT_PUBLIC_API_URL ??
	'http://localhost:3000';

type EmptyClientAccount = {
	email: string;
	password: string;
};

const createConfirmedEmptyClientAccount = async (
	request: APIRequestContext,
): Promise<EmptyClientAccount> => {
	const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
	const account = {
		email: `empty-client-${uniqueSuffix}@example.com`,
		password: 'E2eClientPassword123',
	};

	const signUpResponse = await request.post(`${apiBaseUrl}/users/sign-up`, {
		data: {
			username: `empty-client-${uniqueSuffix}`,
			email: account.email,
			password: account.password,
		},
	});
	expect(signUpResponse.ok()).toBe(true);

	const signUpBody = (await signUpResponse.json()) as {
		emailConfirmationPreviewToken?: string | null;
	};
	expect(signUpBody.emailConfirmationPreviewToken).toEqual(expect.any(String));

	const confirmEmailResponse = await request.post(
		`${apiBaseUrl}/users/confirm-email`,
		{
			data: {
				token: signUpBody.emailConfirmationPreviewToken,
			},
		},
	);
	expect(confirmEmailResponse.ok()).toBe(true);

	return account;
};

const loginWithCredentials = async (
	page: Page,
	account: EmptyClientAccount,
) => {
	await page.goto('/login');
	await page.getByLabel(/e-mail/i).fill(account.email);
	await page.getByLabel(/senha/i).fill(account.password);
	const submitButton = page.getByRole('button', { name: /entrar agora/i });
	await expect(submitButton).toBeEnabled();
	await submitButton.click();

	await expect(page).toHaveURL(/\/client(?:$|[/?#])/);
	await expect(page.locator('body')).toContainText(/portal do cliente/i);
};

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
		request,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		const account = await createConfirmedEmptyClientAccount(request);
		await loginWithCredentials(page, account);

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
