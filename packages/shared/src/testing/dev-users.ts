export type DevUserRole = 'ADMIN' | 'BOOSTER' | 'CLIENT';

export type DevUser = {
	email: string;
	username: string;
	role: DevUserRole;
	dashboardPath: string;
};

export const DEV_USER_PASSWORD = 'DevPassword123!';

export const DEV_USERS = [
	{
		email: 'admin@elojob.com',
		username: 'dev-admin',
		role: 'ADMIN',
		dashboardPath: '/admin',
	},
	{
		email: 'booster@elojob.com',
		username: 'dev-booster',
		role: 'BOOSTER',
		dashboardPath: '/booster',
	},
	{
		email: 'client@elojob.com',
		username: 'dev-client',
		role: 'CLIENT',
		dashboardPath: '/client',
	},
] as const satisfies readonly DevUser[];
