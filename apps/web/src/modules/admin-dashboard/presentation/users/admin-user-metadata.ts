export const roleOptions = [
	{ value: 'CLIENT', label: 'Cliente' },
	{ value: 'BOOSTER', label: 'Booster' },
	{ value: 'ADMIN', label: 'Admin' },
] as const;

export const roleLabels: Record<string, string> = Object.fromEntries(
	roleOptions.map(({ value, label }) => [value, label]),
);
