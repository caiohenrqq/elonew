export const orderServiceTypes = [
	'elo_boost',
	'duo_boost',
	'md5',
	'coaching',
] as const;

export type OrderServiceType = (typeof orderServiceTypes)[number];
