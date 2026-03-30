export const orderExtraTypes = [
	'mmr_nerfed',
	'mmr_buffed',
	'priority_service',
	'favorite_booster',
	'super_restriction',
	'extra_win',
	'restricted_schedule',
	'kd_reduction',
	'deadline_reduction',
	'solo_service',
	'offline_chat',
	'spell_position',
	'specific_lanes',
	'specific_champions',
	'online_stream',
] as const;

export type OrderExtraType = (typeof orderExtraTypes)[number];

export type OrderExtraDefinition = {
	type: OrderExtraType;
	modifierRate: number;
};

export type OrderPricedExtra = {
	type: OrderExtraType;
	price: number;
};

export function isOrderExtraType(value: string): value is OrderExtraType {
	return (orderExtraTypes as readonly string[]).includes(value);
}

export const orderExtraDefinitions: readonly OrderExtraDefinition[] = [
	{ type: 'mmr_nerfed', modifierRate: 0.25 },
	{ type: 'mmr_buffed', modifierRate: 0.35 },
	{ type: 'priority_service', modifierRate: 0.1 },
	{ type: 'favorite_booster', modifierRate: 0.1 },
	{ type: 'super_restriction', modifierRate: 0.35 },
	{ type: 'extra_win', modifierRate: 0.2 },
	{ type: 'restricted_schedule', modifierRate: 0.1 },
	{ type: 'kd_reduction', modifierRate: 0.3 },
	{ type: 'deadline_reduction', modifierRate: 0.2 },
	{ type: 'solo_service', modifierRate: 0.3 },
	{ type: 'offline_chat', modifierRate: 0 },
	{ type: 'spell_position', modifierRate: 0 },
	{ type: 'specific_lanes', modifierRate: 0 },
	{ type: 'specific_champions', modifierRate: 0 },
	{ type: 'online_stream', modifierRate: 0 },
];
